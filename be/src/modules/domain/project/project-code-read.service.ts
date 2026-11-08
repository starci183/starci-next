import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import type { ConceptView } from "./project-view.contracts"
import type { ExplainConceptParams } from "./project-params.contracts"
import type { ProjectSettings } from "./project.contracts"
import { InjectProjectOptions } from "./project.decorators"
import type { ProjectOptions } from "./project.options"
import { conceptOf, milestonesOfKind } from "./project-catalog.policy"
import { InjectProjectCoach, type ProjectCoach } from "./project-coach.port"
import { codeReadMean, codeReadPassed } from "./project-coach.policy"
import { ProjectEvidenceService } from "./project-evidence.service"
import { excerptOf, explanationOf, locationOf } from "./project-input.policy"
import { InjectProjectLessons, type ProjectLessonPort } from "./project-lesson.port"
import { ProjectReadService } from "./project-read.service"
import { projectSettingsOf } from "./project-settings.policy"
import { projectKindOf } from "./project-view.mapper"
import type { ProjectRow, TotalRow } from "./persistence/project.rows"
import { COUNT_CODE_READS, SELECT_PROJECT, UPSERT_CONCEPT } from "./persistence/project.sql"

@Injectable()
/**
 * The AI teacher reading a learner's code (proof for structure concepts): the learner points to the code of a concept and writes
 * two or three sentences; the teacher grades them with the rubric of the matching Essentials lesson through the coach port, with the
 * excerpt and the explanation fenced as untrusted data and any secret-like excerpt refused before a provider call. It needs Premium,
 * and a learner gets a fixed number of reads a day.
 */
export class ProjectCodeReadService {
    private readonly settings: ProjectSettings

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
        @InjectProjectOptions() options: ProjectOptions,
        @InjectProjectLessons() private readonly lessons: ProjectLessonPort,
        @InjectProjectCoach() private readonly coach: ProjectCoach,
        private readonly evidence: ProjectEvidenceService,
        private readonly reads: ProjectReadService,
    ) {
        this.settings = projectSettingsOf(options)
    }

    /**
     * Grades one explanation of a concept against the code the learner points to and answers the concept as it now stands. The
     * grade is stored as `code-read` evidence of the AI teacher (a pass is proof); a read that falls below the bar is kept as a
     * failing result with the teacher's question. A concept whose lesson or rubric is not written yet is PROJECT_CONCEPT_NOT_READY.
     */
    async read(params: ExplainConceptParams): Promise<ConceptView> {
        const rows: Array<ProjectRow> = await this.entityManager.query(SELECT_PROJECT, [
            params.learnerId,
            params.projectId,
        ])
        const [project] = rows
        if (project === undefined) throw new ProjectError({ code: ProjectErrorCode.NotFound })
        const definition = conceptOf(params.conceptId)
        const listed = milestonesOfKind(projectKindOf(project)).some((milestone) =>
            milestone.concepts.includes(params.conceptId),
        )
        if (definition === null || !listed) throw new ProjectError({ code: ProjectErrorCode.ConceptNotFound })
        if (!(await this.entitlement.isPremium(params.learnerId)))
            throw new ProjectError({ code: ProjectErrorCode.PremiumRequired })
        const location = locationOf(params.location)
        const excerpt = excerptOf(params.excerpt)
        const explanation = explanationOf(params.explanation)
        const lesson = (await this.lessons.lessons({ locale: params.locale })).get(params.conceptId)
        const rubric =
            lesson === undefined ? [] : (await this.lessons.rubricOf({ lesson, locale: params.locale })).criteria
        if (rubric.length === 0) throw new ProjectError({ code: ProjectErrorCode.ConceptNotReady })
        const now = this.clock.now()
        const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
        const counted: Array<TotalRow> = await this.entityManager.query(COUNT_CODE_READS, [params.learnerId, dayStart])
        if ((counted[0]?.total ?? 0) >= this.settings.codeReadsPerDay) {
            throw new ProjectError({ code: ProjectErrorCode.CodeReadLimit })
        }
        const grade = await this.coach.read({
            requestId: `read-${now.getTime()}`,
            locale: params.locale,
            concept: definition.label[params.locale],
            rubric,
            location,
            excerpt,
            explanation,
            timeoutMs: this.settings.codeReadTimeoutMs,
        })
        const passed = codeReadPassed(grade)
        await this.entityManager.transaction(async (manager) => {
            await this.evidence.append(manager, project.project_id, [
                {
                    conceptId: params.conceptId,
                    slot: "code-read",
                    source: "ai",
                    passed,
                    ref: location,
                    runId: `read-${now.getTime()}`,
                    commitSha: null,
                    detail: {
                        reason: passed ? "read-passed" : "read-below-bar",
                        facts: { mean: Math.round(codeReadMean(grade) * 100) / 100 },
                        levels: grade.criteria,
                        question: grade.question,
                    },
                    at: now,
                },
            ])
            await manager.query(UPSERT_CONCEPT, [project.project_id, params.conceptId, location, null, null, now])
        })
        await this.evidence.settle(project, [])
        return this.reads.concept(params)
    }
}
