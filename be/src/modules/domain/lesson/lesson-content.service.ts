import { Injectable, Optional } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectEntitlementService, type EntitlementService, type EssentialPart } from "@modules/domain/entitlement"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { LessonError, LessonErrorCode } from "./errors/lesson.error"
import type { VersionRow } from "./persistence/lesson.rows"
import { SELECT_PUBLISHED, SELECT_VERSION, SELECT_VERSIONS_CONTENT } from "./persistence/lesson.sql"
import type { LessonEssential } from "./lesson-essential.contracts"
import type { LessonSourceArchive } from "./lesson-source-archive.policy"
import { LessonSourceService } from "./lesson-source.service"

/** The live version of a lesson as the relay signs it: its four-part fields and its source tarball, when it ships one. */
export interface LessonRunnable {
    /** The live version: the content commit it was imported at. */
    readonly version: string
    /** The four-part fields, whole. */
    readonly essential: LessonEssential
    /** The tarball of its `source/` folder, or null. */
    readonly source: LessonSourceArchive | null
}
import { needsPremium } from "./lesson-access.policy"
import type {
    LessonAccessParams,
    LessonActivityParams,
    LessonOutline,
    LessonPlan,
    LessonServerActivity,
} from "./lesson-read.contracts"
import { findActivity } from "./lesson-activity.policy"
import { outlineOf } from "./lesson-outline.policy"
import type { LessonLocale } from "./lesson.contracts"

@Injectable()
/**
 * The server-side port to the stored content: the attempts and grading side reads the whole activity here, with its
 * answers and rubric, for the version a learner studies. Nothing it returns may reach a browser before a submit.
 */
export class LessonContentService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
        @Optional() private readonly sources?: LessonSourceService,
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
     * The prompts of many stored activities in one locale, read in one query for all their versions. The map key is
     * `lessonId:version:activityId`; an activity that does not exist is left out.
     */
    async prompts(
        refs: ReadonlyArray<Omit<LessonActivityParams, "locale">>,
        locale: LessonLocale,
    ): Promise<ReadonlyMap<string, string>> {
        const prompts = new Map<string, string>()
        if (refs.length === 0) return prompts
        const versions = [...new Map(refs.map((ref) => [`${ref.lessonId}:${ref.version}`, ref])).values()]
        const rows: Array<Pick<VersionRow, "lesson_id" | "version" | "content">> = await this.entityManager.query(
            SELECT_VERSIONS_CONTENT,
            [versions.map((ref) => ref.lessonId), versions.map((ref) => ref.version)],
        )
        const byVersion = new Map(rows.map((row) => [`${row.lesson_id}:${row.version}`, row]))
        for (const ref of refs) {
            const row = byVersion.get(`${ref.lessonId}:${ref.version}`)
            const found = row === undefined ? null : findActivity(row.content.locales[locale], ref.activityId)
            if (found !== null) prompts.set(`${ref.lessonId}:${ref.version}:${ref.activityId}`, found.activity.prompt)
        }
        return prompts
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

    /**
     * The activities of a lesson version in one locale with their phase, outcomes and diagnostic mark, and the outcome ids of the
     * lesson: what a progress read judges phases and outcomes against. Not found when the version does not exist.
     */
    async outline(lessonId: string, version: string, locale: LessonLocale): Promise<LessonOutline> {
        const rows: Array<VersionRow> = await this.entityManager.query(SELECT_VERSION, [lessonId, version])
        const row = rows[0]
        if (row === undefined) throw new LessonError({ code: LessonErrorCode.NotFound })
        return outlineOf(row.content.locales[locale])
    }

    /**
     * The four-part fields of the live version of a lesson, whole (scenario commands, guards, hidden challenge scenarios and
     * their test sources): what the relay signs into a learner CLI manifest. Null when the lesson is not live or carries none.
     * Nothing it returns may reach a browser.
     */
    async runnable(lessonId: string): Promise<LessonRunnable | null> {
        const rows: Array<VersionRow> = await this.entityManager.query(SELECT_PUBLISHED, [lessonId])
        const row = rows[0]
        const essential = row?.content.locales.vi.essential
        if (row === undefined || essential === undefined) return null
        return { version: row.version, essential, source: this.sources?.archiveOf(row) ?? null }
    }

    /**
     * The tarball of the `source/` folder of one stored lesson version (live or superseded), every entry under `source/` and
     * nothing of `hidden/`. Not found when the version does not exist or ships no source.
     */
    async sourceArchive(lessonId: string, version: string): Promise<LessonSourceArchive> {
        const rows: Array<VersionRow> = await this.entityManager.query(SELECT_VERSION, [lessonId, version])
        const archive = rows[0] === undefined ? null : (this.sources?.archiveOf(rows[0]) ?? null)
        if (archive === null) throw new LessonError({ code: LessonErrorCode.NotFound })
        return archive
    }

    /**
     * Lets free content through for any learner and refuses the rest without Premium. Content is free when the teacher marked it
     * `isPremium: false`; with no mark only the free phase is free, and review is not. Content of an Essentials part (`part`)
     * follows the entitlement setting of free parts instead (default: Bản chất free, Source, Kịch bản and Tự áp dụng Premium).
     */
    async requireAccess(params: LessonAccessParams): Promise<void> {
        if (params.part !== undefined) {
            if (await this.entitlement.mayReadEssentialPart(params.learnerId, params.part)) return
            throw new LessonError({ code: LessonErrorCode.PremiumRequired })
        }
        if (!needsPremium(params.phase, params.isPremium) || (await this.entitlement.isPremium(params.learnerId)))
            return
        throw new LessonError({ code: LessonErrorCode.PremiumRequired })
    }

    /** Whether the learner may read one part of an Essentials lesson: the same question `requireAccess` asks, answered as a flag. */
    mayReadPart(learnerId: string, part: EssentialPart): Promise<boolean> {
        return this.entitlement.mayReadEssentialPart(learnerId, part)
    }
}
