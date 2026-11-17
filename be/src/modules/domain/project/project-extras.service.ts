import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { EssentialsExperienceService, previewLineOf } from "@modules/domain/career"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import { isRecord } from "@modules/platform/primitives"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import type { ConceptDefinition, EvidenceRow, ProjectLocale } from "./project.contracts"
import { assertSubscriber } from "./project-access.policy"
import { conceptIn, isListed, learnLessonOf, type ProjectCatalog } from "./project-check-set-lookup.policy"
import { ProjectCheckSetService } from "./project-check-set.service"
import { codeReadMean, codeReadPassed } from "./project-coach.policy"
import { experienceSubjectOf, milestoneExperienceOf, proofEvidenceOf } from "./project-experience.policy"
import { InjectProjectLessons, type ProjectLessonPort } from "./project-lesson.port"
import type { ConceptLookupParams } from "./project-params.contracts"
import { projectStandingOf } from "./project-state.policy"
import type { CodeReadCriterionView, CodeReadView, CvEvidenceLinkView, CvPreviewView } from "./project-view.contracts"
import { projectKindOf, toEvidenceRows } from "./project-view.mapper"
import type { EvidenceDbRow, ProjectRow } from "./persistence/project.rows"
import { SELECT_EVIDENCE, SELECT_PROJECT } from "./persistence/project.sql"

/** What previews the CV line of one concept or one milestone of a project. */
export interface CvPreviewParams {
    /** The owner. */
    readonly learnerId: string
    /** The project. */
    readonly projectId: string
    /** The concept, or null when a milestone is asked. */
    readonly conceptId: string | null
    /** The milestone, or null when a concept is asked. */
    readonly milestoneId: string | null
    /** The locale of the line. */
    readonly locale: ProjectLocale
}

const verdictOf = (level: number): CodeReadCriterionView["verdict"] => {
    if (level >= 2) return "met"
    return level === 1 ? "partial" : "missing"
}

/** One stored level of a read, or null when the stored detail is not the shape a read writes. */
const storedLevelOf = (
    entry: unknown,
): { readonly criterionId: string; readonly level: number; readonly evidenceQuote: string } | null => {
    if (!isRecord(entry)) return null
    const { criterionId, level, evidenceQuote } = entry
    if (typeof criterionId !== "string" || typeof level !== "number") return null
    return { criterionId, level, evidenceQuote: typeof evidenceQuote === "string" ? evidenceQuote : "" }
}

const newestOf = (rows: ReadonlyArray<EvidenceRow>): EvidenceRow | null =>
    rows.reduce<EvidenceRow | null>((best, row) => (best === null || row.at > best.at ? row : best), null)

@Injectable()
/**
 * The two reads a project screen adds to the evidence: what the AI teacher said about the code of a concept (every rubric criterion
 * with its verdict, the hash of the excerpt that was read, when) and the CV line a proved concept or milestone would give with the
 * proof under it. Both are Premium reads: a learner without Premium is refused `PROJECT_PREMIUM_REQUIRED` before anything is read, and
 * the preview only drafts the line (`previewLineOf`), it never produces an experience item.
 */
export class ProjectExtrasService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
        @InjectProjectLessons() private readonly lessons: ProjectLessonPort,
        private readonly essentials: EssentialsExperienceService,
        private readonly checkSet: ProjectCheckSetService,
    ) {}

    /** The newest AI read of a concept of the learner's project, or null when it has none yet. */
    async codeRead(params: ConceptLookupParams): Promise<CodeReadView | null> {
        await assertSubscriber(this.entitlement, params.learnerId)
        const project = await this.projectOf(params.learnerId, params.projectId)
        const set = await this.checkSet.current()
        const concept = this.requireListed(set, project, params.conceptId)
        const rows = await this.rowsOf(project)
        const read = newestOf(
            rows.filter((row) => row.conceptId === params.conceptId && row.slot === "code-read" && row.source === "ai"),
        )
        if (read === null) return null
        const live = await this.lessons.lessons({ locale: params.locale })
        const lessonId = learnLessonOf(concept, new Set(live.keys()))
        const lesson = lessonId === null ? undefined : live.get(lessonId)
        const rubric =
            lesson === undefined ? [] : (await this.lessons.rubricOf({ lesson, locale: params.locale })).criteria
        const texts = new Map(rubric.map((criterion) => [criterion.id, criterion.criterion]))
        const stored = Array.isArray(read.detail["levels"]) ? read.detail["levels"] : []
        const criteria = stored.flatMap((entry): ReadonlyArray<CodeReadCriterionView> => {
            const level = storedLevelOf(entry)
            return level === null
                ? []
                : [
                      {
                          criterionId: level.criterionId,
                          criterion: texts.get(level.criterionId) ?? level.criterionId,
                          level: level.level,
                          verdict: verdictOf(level.level),
                          evidenceQuote: level.evidenceQuote,
                      },
                  ]
        })
        const grade = { criteria, question: "" }
        const question = read.detail["question"]
        const hash = read.detail["excerptHash"]
        return {
            projectId: project.project_id,
            conceptId: params.conceptId,
            passed: codeReadPassed(grade),
            mean: Math.round(codeReadMean(grade) * 100) / 100,
            criteria,
            question: typeof question === "string" && question !== "" ? question : null,
            location: read.ref,
            excerptHash: typeof hash === "string" ? hash : null,
            gradedAt: read.at.toISOString(),
        }
    }

    /** The CV line of one concept or one milestone of the learner's project as it would read now, with its proof. */
    async cvPreview(params: CvPreviewParams): Promise<CvPreviewView> {
        await assertSubscriber(this.entitlement, params.learnerId)
        if ((params.conceptId === null) === (params.milestoneId === null))
            throw new ProjectError({ code: ProjectErrorCode.InputInvalid })
        const project = await this.projectOf(params.learnerId, params.projectId)
        const rows = await this.rowsOf(project)
        const lessons = await this.lessons.lessons({ locale: params.locale })
        const set = await this.checkSet.current()
        const lessonIds = new Set(lessons.keys())
        const standing = projectStandingOf(set, projectKindOf(project), rows, lessonIds)
        if (params.conceptId !== null)
            return this.conceptPreview(project, params, rows, standing, { set, lessonIds, conceptId: params.conceptId })
        return this.milestonePreview(project, params, rows, standing, set, params.milestoneId ?? "")
    }

    private async conceptPreview(
        project: ProjectRow,
        params: CvPreviewParams,
        rows: ReadonlyArray<EvidenceRow>,
        standing: ReturnType<typeof projectStandingOf>,
        scope: { readonly set: ProjectCatalog; readonly lessonIds: ReadonlySet<string>; readonly conceptId: string },
    ): Promise<CvPreviewView> {
        const { set, lessonIds, conceptId } = scope
        const concept = this.requireListed(set, project, conceptId)
        const own = rows.filter((row) => row.conceptId === conceptId)
        const lessonId = learnLessonOf(concept, lessonIds)
        const draft =
            lessonId !== null
                ? await this.essentials.preview({
                      learnerId: params.learnerId,
                      lessonId,
                      project: { projectId: project.project_id, title: project.name, language: project.language },
                  })
                : null
        return {
            projectId: project.project_id,
            subjectKind: "concept",
            subjectId: conceptId,
            proved: standing.provedConceptIds.includes(conceptId),
            text: draft === null ? null : (previewLineOf(draft.itemType, draft.slotValues)?.[params.locale] ?? null),
            evidence: this.linksOf(proofEvidenceOf(own)),
        }
    }

    private milestonePreview(
        project: ProjectRow,
        params: CvPreviewParams,
        rows: ReadonlyArray<EvidenceRow>,
        standing: ReturnType<typeof projectStandingOf>,
        set: ProjectCatalog,
        milestoneId: string,
    ): CvPreviewView {
        const found = standing.milestones.find((milestone) => milestone.definition.id === milestoneId)
        if (found === undefined) throw new ProjectError({ code: ProjectErrorCode.MilestoneNotFound })
        const own = rows.filter((row) => found.definition.concepts.includes(row.conceptId))
        const draft = milestoneExperienceOf({
            subject: experienceSubjectOf(project),
            milestone: found.definition,
            rows: own,
            concepts: set.concepts,
            at: this.clock.now(),
        })
        return {
            projectId: project.project_id,
            subjectKind: "milestone",
            subjectId: milestoneId,
            proved: found.state === "done",
            text: previewLineOf(draft.itemType, draft.slotValues)?.[params.locale] ?? null,
            evidence: this.linksOf(draft.evidence),
        }
    }

    private linksOf(
        evidence: ReadonlyArray<{ kind: string; ref: string; proofForm: string; at: string }>,
    ): ReadonlyArray<CvEvidenceLinkView> {
        return evidence.map((item) => ({ kind: item.kind, ref: item.ref, proofForm: item.proofForm, at: item.at }))
    }

    private async projectOf(learnerId: string, projectId: string): Promise<ProjectRow> {
        const found: Array<ProjectRow> = await this.entityManager.query(SELECT_PROJECT, [learnerId, projectId])
        const [project] = found
        if (project === undefined) throw new ProjectError({ code: ProjectErrorCode.NotFound })
        return project
    }

    private requireListed(set: ProjectCatalog, project: ProjectRow, conceptId: string): ConceptDefinition {
        const concept = conceptIn(set, conceptId)
        if (concept === null || !isListed(set, projectKindOf(project), conceptId))
            throw new ProjectError({ code: ProjectErrorCode.ConceptNotFound })
        return concept
    }

    private async rowsOf(project: ProjectRow): Promise<ReadonlyArray<EvidenceRow>> {
        const evidence: Array<EvidenceDbRow> = await this.entityManager.query(SELECT_EVIDENCE, [
            [project.project_id],
            LIST_ROWS_MAX,
        ])
        return toEvidenceRows(evidence)
    }
}
