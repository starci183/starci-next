import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { InterviewError, InterviewErrorCode } from "./errors/interview.error"
import { InterviewAccessService } from "./interview-access.service"
import { InjectInterviewCoach, type InterviewCoach } from "./interview-coach.port"
import { InterviewQuestionService } from "./interview-question.service"
import { toTranscript, toTurnView } from "./interview-session.mapper"
import { DONE_TEXT, SKIPPED_TEXT } from "./interview-script.policy"
import type { AnswerView, InterviewerDecision, TurnKind, TurnRole } from "./interview.contracts"
import { InterviewLogEvent } from "./interview.log-events"
import { MAX_FOLLOW_UPS } from "./interviewer-prompt.policy"
import type { QuestionPublicRow, SessionRow, TurnRow } from "./persistence/interview.rows"
import {
    INSERT_TURN,
    SELECT_SESSION,
    SELECT_SESSION_FOR_UPDATE,
    SELECT_TURNS,
    TOUCH_SESSION,
    UPDATE_POSITION,
} from "./persistence/interview.sql"
import { materialOf, promptAtOf, promptOf } from "./question-lookup.policy"

/** How long the interviewer has to decide the next turn. */
const REPLY_TIMEOUT_MS = 30_000

/** What the learner sent for the open question. */
export interface AnswerParams {
    /** The learner. */
    readonly learnerId: string
    /** The session. */
    readonly sessionId: string
    /** The question position; it must be the open one. */
    readonly position: number
    /** The revision of the answer to this question: 0 for the first, then one more for each follow-up answered. */
    readonly revision: number
    /** The answer. */
    readonly text: string
    /** True to skip the question. */
    readonly isSkipped: boolean
}

/** A turn to store. */
interface NewTurn {
    /** The session. */
    readonly sessionId: string
    /** The question position. */
    readonly position: number
    /** Who speaks. */
    readonly role: TurnRole
    /** What the turn is. */
    readonly kind: TurnKind
    /** The text. */
    readonly content: string
    /** The revision of a candidate answer, or null. */
    readonly revision: number | null
    /** True when the model produced it. */
    readonly byAi: boolean
}

/** The outcome of a hint. */
export interface HintView {
    /** The stored hint turn. */
    readonly turnId: string
    /** The hint. */
    readonly text: string
    /** The hints used on this question. */
    readonly hintsUsed: number
    /** The hints left. */
    readonly hintsLeft: number
}

const failureOf = (cause: unknown): InterviewErrorCode =>
    cause instanceof InterviewError ? cause.code : InterviewErrorCode.CoachUnavailable

@Injectable()
/**
 * Runs the conversation of an active session: stores every candidate turn before anything else, asks the interviewer for the next
 * turn, gives authored hints on request and retries an interviewer step that failed. It never grades and never shows a score.
 */
export class InterviewTurnService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectLogger() private readonly logger: Logger,
        @InjectInterviewCoach() private readonly coach: InterviewCoach,
        private readonly access: InterviewAccessService,
        private readonly questions: InterviewQuestionService,
    ) {}

    /**
     * Stores the answer, then asks the interviewer what follows. A resend of the same revision with the same text answers the
     * stored turn; the same revision with other text is a conflict. A failed or refused AI step never loses the answer.
     */
    async answer(params: AnswerParams): Promise<AnswerView> {
        const text = params.isSkipped ? "" : params.text.trim()
        if (!params.isSkipped && text === "") throw new InterviewError({ code: InterviewErrorCode.AnswerInvalid })
        const stored = await this.store(params, text)
        if (stored.replay) return this.answered(stored.row, await this.followerOf(params.sessionId, stored.row.seq))
        if (params.isSkipped) return this.advance(stored.session, stored.row)
        return this.reply(stored.session, stored.row)
    }

    /** Gives the next authored hint of the open question; the hint is recorded and takes a little off that question's score. */
    hint(learnerId: string, sessionId: string, position: number): Promise<HintView> {
        return this.entityManager.transaction(async (manager) => {
            const session = await this.lockActive(manager, learnerId, sessionId)
            if (position !== session.current_position)
                throw new InterviewError({ code: InterviewErrorCode.AnswerInvalid })
            const turns = await this.turnsOf(manager, sessionId)
            const [row] = await this.questions.publicOf(session.questions.slice(position, position + 1), manager)
            const locale = session.locale
            const hints = row?.interviewer[locale].hints ?? []
            const used = turns.filter((turn) => turn.position === position && turn.kind === "hint").length
            const text = hints[used]
            if (text === undefined) throw new InterviewError({ code: InterviewErrorCode.HintNoneLeft })
            const stored = await this.insert(manager, {
                sessionId,
                position,
                role: "interviewer",
                kind: "hint",
                content: text,
                revision: null,
                byAi: false,
            })
            await manager.query(TOUCH_SESSION, [sessionId, this.clock.now()])
            return { turnId: stored.turn_id, text, hintsUsed: used + 1, hintsLeft: hints.length - used - 1 }
        })
    }

    /** Asks the interviewer again for the turn a failure skipped; the learner is never asked to answer twice. */
    async retry(learnerId: string, sessionId: string): Promise<AnswerView> {
        const found: Array<SessionRow> = await this.entityManager.query(SELECT_SESSION, [learnerId, sessionId])
        const session = found[0]
        if (session === undefined) throw new InterviewError({ code: InterviewErrorCode.SessionNotFound })
        if (session.status !== "active") throw new InterviewError({ code: InterviewErrorCode.SessionClosed })
        const turns = await this.turnsOf(this.entityManager, sessionId)
        const last = turns.at(-1)
        if (last?.role !== "candidate") {
            throw new InterviewError({ code: InterviewErrorCode.NothingToRetry })
        }
        return this.reply(session, last)
    }

    private async lockActive(manager: EntityManager, learnerId: string, sessionId: string): Promise<SessionRow> {
        const found: Array<SessionRow> = await manager.query(SELECT_SESSION_FOR_UPDATE, [learnerId, sessionId])
        const session = found[0]
        if (session === undefined) throw new InterviewError({ code: InterviewErrorCode.SessionNotFound })
        if (session.status !== "active") throw new InterviewError({ code: InterviewErrorCode.SessionClosed })
        return session
    }

    private turnsOf(manager: EntityManager, sessionId: string): Promise<Array<TurnRow>> {
        return manager.query(SELECT_TURNS, [sessionId, LIST_ROWS_MAX])
    }

    private async insert(manager: EntityManager, turn: NewTurn): Promise<TurnRow> {
        const rows: Array<TurnRow> = await manager.query(INSERT_TURN, [
            turn.sessionId,
            turn.position,
            turn.role,
            turn.kind,
            turn.content,
            turn.revision,
            turn.byAi,
            this.clock.now(),
        ])
        const row = rows[0]
        if (row === undefined) throw new InterviewError({ code: InterviewErrorCode.RevisionConflict })
        return row
    }

    /** Stores the candidate turn in one transaction, after the checks of the open question. */
    private store(
        params: AnswerParams,
        text: string,
    ): Promise<{ readonly session: SessionRow; readonly row: TurnRow; readonly replay: boolean }> {
        return this.entityManager.transaction(async (manager) => {
            const session = await this.lockActive(manager, params.learnerId, params.sessionId)
            const turns = await this.turnsOf(manager, params.sessionId)
            const candidate = turns.filter((turn) => turn.role === "candidate" && turn.position === params.position)
            const held = candidate.find((turn) => turn.revision === params.revision)
            const content = params.isSkipped ? SKIPPED_TEXT[session.locale] : text
            if (held !== undefined) {
                if (held.content !== content) throw new InterviewError({ code: InterviewErrorCode.RevisionConflict })
                return { session, row: held, replay: true }
            }
            const waiting = turns.at(-1)?.role === "candidate"
            if (params.position !== session.current_position || params.revision !== candidate.length || waiting) {
                throw new InterviewError({ code: InterviewErrorCode.AnswerInvalid })
            }
            const row = await this.insert(manager, {
                sessionId: params.sessionId,
                position: params.position,
                role: "candidate",
                kind: params.isSkipped ? "skip" : "answer",
                content,
                revision: params.revision,
                byAi: false,
            })
            await manager.query(TOUCH_SESSION, [params.sessionId, this.clock.now()])
            return { session, row, replay: false }
        })
    }

    private async followerOf(sessionId: string, seq: number): Promise<TurnRow | null> {
        const turns = await this.turnsOf(this.entityManager, sessionId)
        const next = turns.find((turn) => turn.seq === seq + 1)
        return next?.role === "interviewer" ? next : null
    }

    private answered(saved: TurnRow, next: TurnRow | null): AnswerView {
        return {
            saved: toTurnView(saved),
            next: next === null ? null : toTurnView(next),
            status: "active",
            failureCode: null,
        }
    }

    /** Moves to the next question (or says the interview is over) without asking the model: a skip, or the follow-up limit. */
    private async advance(session: SessionRow, saved: TurnRow): Promise<AnswerView> {
        const next = await this.apply(session, saved, { action: "next", text: "" }, false)
        return this.answered(saved, next)
    }

    /** Asks the interviewer for the turn that follows a stored answer, within the follow-up limit and the fair-use cap. */
    private async reply(session: SessionRow, saved: TurnRow): Promise<AnswerView> {
        const turns = await this.turnsOf(this.entityManager, session.session_id)
        const here = turns.filter((turn) => turn.position === saved.position)
        const asked = here.filter((turn) => turn.kind === "followUp" || turn.kind === "probe").length
        if (asked >= MAX_FOLLOW_UPS) return this.advance(session, saved)
        const decision = await this.decide(session, saved, here, asked)
        const next = await this.apply(session, saved, decision.said, decision.byAi)
        return this.answered(saved, next)
    }

    /**
     * Asks the model what the interviewer says next. When the model cannot answer (no provider, a failure, a bad reply or the
     * fair-use cap) the interview goes on without it: the interviewer moves to the next authored question and only the AI follow-up
     * is skipped, so a learner can always finish a session.
     */
    private async decide(
        session: SessionRow,
        saved: TurnRow,
        here: ReadonlyArray<TurnRow>,
        asked: number,
    ): Promise<{ readonly said: InterviewerDecision; readonly byAi: boolean }> {
        try {
            await this.access.requireAiBudget(session.learner_id)
            const [row] = await this.questions.publicOf(session.questions.slice(saved.position, saved.position + 1))
            const locale = session.locale
            const drawn = session.questions[saved.position]
            if (row === undefined || drawn === undefined) {
                throw new InterviewError({ code: InterviewErrorCode.SessionNotFound })
            }
            const prompt = promptOf(row.bodies, drawn.bodyLanguage, locale)
            const said = await this.coach.decide({
                requestId: `${session.session_id}:${saved.seq}`,
                locale,
                family: row.family,
                prompt: prompt.prompt,
                material: materialOf(prompt),
                followUps: row.interviewer[locale].followUps,
                asked,
                transcript: toTranscript(here),
                timeoutMs: REPLY_TIMEOUT_MS,
            })
            return { said, byAi: true }
        } catch (cause) {
            this.logger.error(InterviewLogEvent.ReplyFailed, cause, {
                sessionId: session.session_id,
                code: failureOf(cause),
            })
            return { said: { action: "next", text: "" }, byAi: false }
        }
    }

    /** Stores the interviewer's next turn under the session lock; if another call already replied, that reply is the answer. */
    private apply(session: SessionRow, saved: TurnRow, decision: InterviewerDecision, byAi: boolean): Promise<TurnRow> {
        return this.entityManager.transaction(async (manager) => {
            await this.lockActive(manager, session.learner_id, session.session_id)
            const turns = await this.turnsOf(manager, session.session_id)
            const existing = turns.find((turn) => turn.seq === saved.seq + 1)
            if (existing !== undefined) return existing
            const locale = session.locale
            if (decision.action !== "next") {
                return this.insert(manager, {
                    sessionId: session.session_id,
                    position: saved.position,
                    role: "interviewer",
                    kind: decision.action,
                    content: decision.text,
                    revision: null,
                    byAi,
                })
            }
            const position = saved.position + 1
            if (position >= session.questions.length) {
                return this.insert(manager, {
                    sessionId: session.session_id,
                    position: saved.position,
                    role: "interviewer",
                    kind: "done",
                    content: DONE_TEXT[locale],
                    revision: null,
                    byAi,
                })
            }
            const rows: Array<QuestionPublicRow> = await this.questions.publicOf(
                session.questions.slice(position, position + 1),
                manager,
            )
            const prompt = promptAtOf(session.questions, rows, position, locale)
            await manager.query(UPDATE_POSITION, [session.session_id, position, this.clock.now()])
            return this.insert(manager, {
                sessionId: session.session_id,
                position,
                role: "interviewer",
                kind: "prompt",
                content: prompt,
                revision: null,
                byAi,
            })
        })
    }
}
