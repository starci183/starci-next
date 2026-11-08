import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { LessonLinkService } from "@modules/domain/lesson"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import { drawQuestions } from "./draw.policy"
import { InterviewError, InterviewErrorCode } from "./errors/interview.error"
import { InterviewAccessService } from "./interview-access.service"
import { InterviewQuestionService } from "./interview-question.service"
import { toSessionView } from "./interview-session.mapper"
import { InjectInterviewResolvedOptions } from "./interview.decorators"
import {
    INTERVIEW_TIERS,
    type AbandonView,
    type InterviewLocale,
    type InterviewTier,
    type SessionView,
} from "./interview.contracts"
import type { InterviewSettings } from "./interview.options"
import type { PoolRow, SessionRow, TurnRow } from "./persistence/interview.rows"
import {
    ABANDON_IDLE,
    ABANDON_SESSION,
    INSERT_SESSION,
    INSERT_TURN,
    LOCK_LEARNER,
    SELECT_ACTIVE_SESSION,
    SELECT_POOL,
    SELECT_PREVIOUS_SCORE,
    SELECT_RECENT_QUESTIONS,
    SELECT_SESSION,
    SELECT_SESSION_BY_REQUEST,
    SELECT_TURNS,
} from "./persistence/interview.sql"
import { promptAtOf } from "./question-lookup.policy"
import { inPool, likePatternsOf, offersTier, tracksOf } from "./track.policy"

/** How many of the learner's newest sessions on a track and tier the draw tries not to repeat. */
const RECENT_SESSIONS = 3

/** The pool bound: the questions of one tier in the banks of one track. */
const POOL_ROWS_MAX = 1000

/** What the learner chose on the home screen. */
export interface StartParams {
    /** The learner. */
    readonly learnerId: string
    /** The track. */
    readonly track: string
    /** Only these banks, or null for every bank of the track. */
    readonly bankIds: ReadonlyArray<string> | null
    /** The tier. */
    readonly tier: InterviewTier
    /** The locale. */
    readonly locale: InterviewLocale
    /** The code language, or null. */
    readonly language: string | null
    /** The idempotency key of the start. */
    readonly clientRequestId: string
}

@Injectable()
/** Starts, reads and abandons interview sessions: the draw, the quota, the first prompt and the view a learner reads. */
export class InterviewSessionService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectInterviewResolvedOptions() private readonly settings: InterviewSettings,
        private readonly access: InterviewAccessService,
        private readonly questions: InterviewQuestionService,
        private readonly lessons: LessonLinkService,
    ) {}

    /**
     * Starts a session: the track and tier are checked, the free quota or Premium is checked before anything is drawn, the
     * questions are drawn once and fixed, and the first prompt is stored. No AI call is made. A resend with the same request id
     * answers the session it started.
     */
    async start(params: StartParams): Promise<SessionView> {
        const track = tracksOf(this.settings.pool).find((entry) => entry.id === params.track)
        if (track === undefined || !INTERVIEW_TIERS.includes(params.tier) || !offersTier(track, params.tier)) {
            throw new InterviewError({ code: InterviewErrorCode.SetupInvalid })
        }
        const now = this.clock.now()
        const idle = new Date(now.getTime() - this.settings.idleMinutes * 60_000)
        const sessionId = await this.entityManager.transaction(async (manager) => {
            await manager.query(LOCK_LEARNER, [params.learnerId])
            const replay: Array<SessionRow> = await manager.query(SELECT_SESSION_BY_REQUEST, [
                params.learnerId,
                params.clientRequestId,
            ])
            if (replay[0] !== undefined) return replay[0].session_id
            await manager.query(ABANDON_IDLE, [params.learnerId, idle, now])
            const active: Array<SessionRow> = await manager.query(SELECT_ACTIVE_SESSION, [params.learnerId])
            if (active.length > 0) throw new InterviewError({ code: InterviewErrorCode.SessionActive })
            const access = await this.access.accessOf(params.learnerId, manager)
            const free = !access.isPremium
            if (free && access.freeSessionsLeftThisMonth <= 0) {
                throw new InterviewError({ code: InterviewErrorCode.PremiumRequired })
            }
            const pool: Array<PoolRow> = await manager.query(SELECT_POOL, [
                params.tier,
                free,
                [...likePatternsOf(track, params.tier)],
                POOL_ROWS_MAX,
            ])
            const recent: Array<{ question_id: string }> = await manager.query(SELECT_RECENT_QUESTIONS, [
                params.learnerId,
                params.track,
                params.tier,
                RECENT_SESSIONS,
                LIST_ROWS_MAX,
            ])
            const drawn = drawQuestions({
                candidates: pool
                    .filter((row) => params.bankIds === null || params.bankIds.includes(row.bank_id))
                    .filter((row) => inPool(track, row.family, params.tier, row.bank_id))
                    .map((row) => ({
                        questionId: row.question_id,
                        bankId: row.bank_id,
                        bankVersion: row.bank_version,
                        family: row.family,
                        tier: params.tier,
                        isPremium: row.is_premium,
                        bodyLanguages: row.body_languages,
                    })),
                tier: params.tier,
                free,
                language: params.language,
                length: access.length,
                avoid: new Set(recent.map((row) => row.question_id)),
                seed: `${params.learnerId}|${params.clientRequestId}`,
            })
            if (drawn === null) throw new InterviewError({ code: InterviewErrorCode.PoolEmpty })
            const inserted: Array<SessionRow> = await manager.query(INSERT_SESSION, [
                params.learnerId,
                params.clientRequestId,
                params.track,
                params.tier,
                params.locale,
                params.language,
                access.length,
                free ? "free" : "premium",
                free ? access.freeMonth : null,
                JSON.stringify(drawn),
                now,
            ])
            const created = inserted[0]
            if (created === undefined) throw new InterviewError({ code: InterviewErrorCode.SessionActive })
            const rows = await this.questions.publicOf(drawn.slice(0, 1), manager)
            const prompt = promptAtOf(drawn, rows, 0, params.locale)
            await manager.query(INSERT_TURN, [created.session_id, 0, "interviewer", "prompt", prompt, null, false, now])
            return created.session_id
        })
        return this.read(params.learnerId, sessionId)
    }

    /** The session as the learner reads it; another learner's session is not found. An idle session is abandoned first. */
    async read(learnerId: string, sessionId: string): Promise<SessionView> {
        const now = this.clock.now()
        const idle = new Date(now.getTime() - this.settings.idleMinutes * 60_000)
        await this.entityManager.query(ABANDON_IDLE, [learnerId, idle, now])
        const found: Array<SessionRow> = await this.entityManager.query(SELECT_SESSION, [learnerId, sessionId])
        const row = found[0]
        if (row === undefined) throw new InterviewError({ code: InterviewErrorCode.SessionNotFound })
        const turns: Array<TurnRow> = await this.entityManager.query(SELECT_TURNS, [sessionId, LIST_ROWS_MAX])
        const questions = await this.questions.publicOf(row.questions)
        const moduleRefs = row.status === "graded" ? questions.flatMap((question) => question.module_refs) : []
        const lessons = await this.lessons.ofModules([...new Set(moduleRefs)], row.locale === "en" ? "en" : "vi")
        const previous: Array<{ overall_score: number }> =
            row.graded_at === null
                ? []
                : await this.entityManager.query(SELECT_PREVIOUS_SCORE, [learnerId, row.track, row.tier, row.graded_at])
        return toSessionView(row, turns, questions, lessons, previous[0]?.overall_score ?? null)
    }

    /** Abandons the learner's active session; a session that is not active, or not theirs, is not found. */
    async abandon(learnerId: string, sessionId: string): Promise<AbandonView> {
        const rows: Array<SessionRow> = await this.entityManager.query(ABANDON_SESSION, [
            learnerId,
            sessionId,
            this.clock.now(),
        ])
        if (rows[0] === undefined) throw new InterviewError({ code: InterviewErrorCode.SessionNotFound })
        return { sessionId, status: "abandoned" }
    }
}
