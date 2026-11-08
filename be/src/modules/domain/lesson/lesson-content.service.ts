import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { LessonError, LessonErrorCode } from "./errors/lesson.error"
import type { VersionRow } from "./persistence/lesson.rows"
import { SELECT_VERSION } from "./persistence/lesson.sql"
import { LESSON_FREE_PHASE } from "./lesson.contracts"
import type {
    LessonAccessParams,
    LessonActivityParams,
    LessonPlan,
    LessonServerActivity,
} from "./lesson-read.contracts"
import { findActivity } from "./lesson-activity.policy"

@Injectable()
/**
 * The server-side port to the stored content: the attempts and grading side reads the whole activity here, with its
 * answers and rubric, for the version a learner studies. Nothing it returns may reach a browser before a submit.
 */
export class LessonContentService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
    ) {}

    /**
     * The whole stored activity of a lesson version in one locale, with the phase of its section (`retrieval` for a review
     * activity). Superseded versions stay readable so a learner keeps the version they started. Not found when the version
     * or the activity does not exist.
     */
    async activity(params: LessonActivityParams): Promise<LessonServerActivity> {
        const rows: Array<VersionRow> = await this.entityManager.query(SELECT_VERSION, [
            params.lessonId,
            params.version,
        ])
        const row = rows[0]
        const found = row === undefined ? null : findActivity(row.content.locales[params.locale], params.activityId)
        if (found === null) throw new LessonError({ code: LessonErrorCode.NotFound })
        return found
    }

    /**
     * What completing a stored lesson version takes and schedules: the activity ids a learner must have graded (the section
     * activities that are not diagnostics) and the retrieval activities with their authored days. Not found when the version
     * does not exist.
     */
    async plan(lessonId: string, version: string): Promise<LessonPlan> {
        const rows: Array<VersionRow> = await this.entityManager.query(SELECT_VERSION, [lessonId, version])
        const row = rows[0]
        if (row === undefined) throw new LessonError({ code: LessonErrorCode.NotFound })
        const document = row.content.locales.vi
        return {
            required: document.sections
                .flatMap((section) => section.activities ?? [])
                .filter((activity) => activity.isDiagnostic !== true)
                .map((activity) => activity.id),
            retrieval: document.retrieval.flatMap((activity) =>
                activity.afterDays === undefined ? [] : [{ activityId: activity.id, afterDays: activity.afterDays }],
            ),
        }
    }

    /** Lets the free phase through for any learner and refuses every other phase, review included, without Premium. */
    async requireAccess(params: LessonAccessParams): Promise<void> {
        if (params.phase === LESSON_FREE_PHASE || (await this.entitlement.isPremium(params.learnerId))) return
        throw new LessonError({ code: LessonErrorCode.PremiumRequired })
    }
}
