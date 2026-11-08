import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import type { ConceptLessonRef, ProjectSettings } from "./project.contracts"
import { InjectProjectOptions } from "./project.decorators"
import type { ProjectOptions } from "./project.options"
import { PROJECT_CONCEPTS, PROJECT_MILESTONES } from "./project-catalog.policy"
import { InjectProjectLessons, type ProjectLessonPort } from "./project-lesson.port"
import type {
    CatalogParams,
    ConceptLookupParams,
    MilestoneLookupParams,
    ProjectListParams,
    ProjectLookupParams,
} from "./project-params.contracts"
import { projectSettingsOf } from "./project-settings.policy"
import { projectStandingOf, type ProjectStanding } from "./project-state.policy"
import {
    projectKindOf,
    toCiRunView,
    toConceptView,
    toEvidenceRows,
    toMilestoneSummaryView,
    toProbeRunView,
    toSummaryView,
} from "./project-view.mapper"
import type {
    ConceptView,
    MilestoneView,
    ProjectCatalogView,
    ProjectSummaryView,
    ProjectView,
    ProvedConceptView,
} from "./project-view.contracts"
import type {
    CiRunRow,
    ConceptRow,
    EvidenceDbRow,
    ProbeRunRow,
    ProjectRow,
    ProvedConceptRow,
} from "./persistence/project.rows"
import {
    SELECT_CONCEPTS,
    SELECT_EVIDENCE,
    SELECT_LAST_CI_RUNS,
    SELECT_LAST_PROBE_RUNS,
    SELECT_PROJECT,
    SELECT_PROJECTS,
    SELECT_PROVED_CONCEPTS,
} from "./persistence/project.sql"

/** Everything the views of one project are built from. */
interface ProjectContext {
    /** The project row. */
    readonly row: ProjectRow
    /** Where its milestones and concepts stand. */
    readonly standing: ProjectStanding
    /** The concept pointers by concept id. */
    readonly pointers: ReadonlyMap<string, ConceptRow>
    /** The live lessons by id. */
    readonly lessons: ReadonlyMap<string, ConceptLessonRef>
}

@Injectable()
/**
 * The reads of the projects capability: the learner's projects with where every milestone and concept stands, the concept
 * checklist of a milestone with its evidence chips, the catalog of milestones, and the concepts a learner proved for
 * the path engine. Where a concept stands is computed from the append-only evidence, never stored.
 */
export class ProjectReadService {
    private readonly settings: ProjectSettings

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
        @InjectProjectLessons() private readonly lessons: ProjectLessonPort,
        @InjectProjectOptions() options: ProjectOptions,
    ) {
        this.settings = projectSettingsOf(options)
    }

    /** The learner's projects, oldest first, each with its progress. */
    async list(params: ProjectListParams): Promise<ReadonlyArray<ProjectSummaryView>> {
        const rows: Array<ProjectRow> = await this.entityManager.query(SELECT_PROJECTS, [
            params.learnerId,
            LIST_ROWS_MAX,
        ])
        if (rows.length === 0) return []
        const evidence: Array<EvidenceDbRow> = await this.entityManager.query(SELECT_EVIDENCE, [
            rows.map((row) => row.project_id),
            LIST_ROWS_MAX,
        ])
        const lessons = await this.lessons.lessons({ locale: params.locale })
        const all = toEvidenceRows(evidence)
        return rows.map((row) => {
            const own = all.filter((item) => item.projectId === row.project_id)
            return toSummaryView(row, projectStandingOf(projectKindOf(row), own, new Set(lessons.keys())))
        })
    }

    /** One project with its milestones, the last signed CI run, and the last probe run. */
    async get(params: ProjectLookupParams): Promise<ProjectView> {
        const { row, standing } = await this.contextOf(params)
        const premium = await this.entitlement.isPremium(params.learnerId)
        const ciRuns: Array<CiRunRow> = await this.entityManager.query(SELECT_LAST_CI_RUNS, [[row.project_id], 1])
        const probeRuns: Array<ProbeRunRow> = await this.entityManager.query(SELECT_LAST_PROBE_RUNS, [
            [row.project_id],
            1,
        ])
        const [ciRun] = ciRuns
        const [probeRun] = probeRuns
        return {
            ...toSummaryView(row, standing),
            milestones: standing.milestones.map((milestone) =>
                toMilestoneSummaryView(milestone, params.locale, this.isLocked(milestone.definition.id, premium)),
            ),
            practisingConceptCount: standing.practisingConceptIds.length,
            lastCiRun: ciRun === undefined ? null : toCiRunView(ciRun),
            lastProbeRun: probeRun === undefined ? null : toProbeRunView(probeRun),
        }
    }

    /** One milestone of a project with its concept checklist; a milestone past the free ones needs Premium. */
    async milestone(params: MilestoneLookupParams): Promise<MilestoneView> {
        const context = await this.contextOf(params)
        const found = context.standing.milestones.find((candidate) => candidate.definition.id === params.milestoneId)
        if (found === undefined) throw new ProjectError({ code: ProjectErrorCode.MilestoneNotFound })
        const locked = this.isLocked(params.milestoneId, await this.entitlement.isPremium(params.learnerId))
        if (locked) throw new ProjectError({ code: ProjectErrorCode.PremiumRequired })
        return {
            project: toSummaryView(context.row, context.standing),
            milestone: toMilestoneSummaryView(found, params.locale, locked),
            concepts: found.concepts.map((standing) =>
                toConceptView(
                    standing,
                    context.pointers.get(standing.definition.id),
                    context.lessons.get(standing.definition.id),
                    params.locale,
                ),
            ),
        }
    }

    /** One concept of a project, as its milestone shows it. */
    async concept(params: ConceptLookupParams): Promise<ConceptView> {
        const context = await this.contextOf(params)
        const standing = context.standing.milestones
            .flatMap((milestone) => milestone.concepts)
            .find((candidate) => candidate.definition.id === params.conceptId)
        if (standing === undefined) throw new ProjectError({ code: ProjectErrorCode.ConceptNotFound })
        return toConceptView(
            standing,
            context.pointers.get(params.conceptId),
            context.lessons.get(params.conceptId),
            params.locale,
        )
    }

    /** The project in short, for an answer to a change. */
    async summary(params: ProjectLookupParams): Promise<ProjectSummaryView> {
        const context = await this.contextOf(params)
        return toSummaryView(context.row, context.standing)
    }

    /** The milestone and concept catalog, for the new-project screen. */
    async catalog(params: CatalogParams): Promise<ProjectCatalogView> {
        const { locale } = params
        const lessons = await this.lessons.lessons({ locale })
        return {
            milestones: PROJECT_MILESTONES.map((milestone) => ({
                id: milestone.id,
                title: milestone.title[locale],
                concepts: milestone.concepts,
                free: this.settings.freeMilestones.includes(milestone.id),
            })),
            concepts: PROJECT_CONCEPTS.map((concept) => ({
                id: concept.id,
                label: concept.label[locale],
                kind: concept.kind,
                requires: concept.requires,
                probes: concept.probes,
                comingSoon: !lessons.has(concept.id),
            })),
            freeProjects: this.settings.freeProjects,
        }
    }

    /** The concepts a learner proved in any of their projects, first proof first: the read a path engine counts once per concept. */
    async provedConcepts(learnerId: string): Promise<ReadonlyArray<ProvedConceptView>> {
        const rows: Array<ProvedConceptRow> = await this.entityManager.query(SELECT_PROVED_CONCEPTS, [
            learnerId,
            LIST_ROWS_MAX,
        ])
        return rows.map((row) => ({
            projectId: row.project_id,
            conceptId: row.concept_id,
            provedAt: row.proved_at.toISOString(),
        }))
    }

    /** Reads the project of a learner and where it stands; a project that is not theirs is not found. */
    private async contextOf(params: ProjectLookupParams): Promise<ProjectContext> {
        const rows: Array<ProjectRow> = await this.entityManager.query(SELECT_PROJECT, [
            params.learnerId,
            params.projectId,
        ])
        const [row] = rows
        if (row === undefined) throw new ProjectError({ code: ProjectErrorCode.NotFound })
        const evidence: Array<EvidenceDbRow> = await this.entityManager.query(SELECT_EVIDENCE, [
            [row.project_id],
            LIST_ROWS_MAX,
        ])
        const pointerRows: Array<ConceptRow> = await this.entityManager.query(SELECT_CONCEPTS, [
            [row.project_id],
            LIST_ROWS_MAX,
        ])
        const lessons = await this.lessons.lessons({ locale: params.locale })
        const standing = projectStandingOf(projectKindOf(row), toEvidenceRows(evidence), new Set(lessons.keys()))
        return {
            row,
            standing,
            pointers: new Map(pointerRows.map((pointer) => [pointer.concept_id, pointer])),
            lessons,
        }
    }

    private isLocked(milestoneId: string, premium: boolean): boolean {
        return !premium && !this.settings.freeMilestones.includes(milestoneId)
    }
}
