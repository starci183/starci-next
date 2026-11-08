import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { StreakService } from "@modules/domain/streak"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { InterviewError, InterviewErrorCode } from "./errors/interview.error"
import { InterviewAccessService } from "./interview-access.service"
import { InjectInterviewCoach, type InterviewCoach } from "./interview-coach.port"
import { InterviewQuestionService } from "./interview-question.service"
import { toTranscript } from "./interview-session.mapper"
import { InjectInterviewResolvedOptions } from "./interview.decorators"
import type { GradingQuestion, GradingView, InterviewLocale } from "./interview.contracts"
import { InterviewLogEvent } from "./interview.log-events"
import type { InterviewSettings } from "./interview.options"
import type { QuestionGradingRow, SessionRow, TurnRow } from "./persistence/interview.rows"
import {
    CLAIM_GRADING,
    COMPLETE_GRADING,
    FAIL_GRADING,
    SELECT_SESSION,
    SELECT_TURNS,
    SUBMIT_SESSION,
} from "./persistence/interview.sql"
import { idealOf, promptOf } from "./question-lookup.policy"
import { scorecardOf, type ScoringQuestion } from "./scoring.policy"

/** How long the grader has for the whole session. */
const GRADING_TIMEOUT_MS = 150_000

/** How long a run may hold a session in grading without a sign of life before another run may take it over. */
const GRADING_STALE_MS = 5 * 60_000

const viewOf = (row: SessionRow): GradingView => ({
    sessionId: row.session_id,
    status: row.status,
    failureCode: row.failure_code,
})

@Injectable()
/**
 * Grades a submitted session once, from the whole transcript, against the teacher's rubric and weighted checklist. The model reads
 * the answers and quotes the learner; the server computes every score. The scorecard is stored before the status becomes graded.
 */
export class InterviewGradingService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectLogger() private readonly logger: Logger,
        @InjectInterviewCoach() private readonly coach: InterviewCoach,
        @InjectInterviewResolvedOptions() private readonly settings: InterviewSettings,
        private readonly access: InterviewAccessService,
        private readonly questions: InterviewQuestionService,
        private readonly streak: StreakService,
    ) {}

    /**
     * Ends the interview and grades it. A session with no answer is INTERVIEW_NO_ANSWER. Once the submit is stored the streak
     * action is reported (a failure of the streak never fails the submit), then the grading runs.
     */
    async submit(learnerId: string, sessionId: string): Promise<GradingView> {
        const found: Array<SessionRow> = await this.entityManager.query(SELECT_SESSION, [learnerId, sessionId])
        const session = found[0]
        if (session === undefined) throw new InterviewError({ code: InterviewErrorCode.SessionNotFound })
        if (session.status !== "active") throw new InterviewError({ code: InterviewErrorCode.SessionClosed })
        const turns: Array<TurnRow> = await this.entityManager.query(SELECT_TURNS, [sessionId, LIST_ROWS_MAX])
        if (!turns.some((turn) => turn.kind === "answer"))
            throw new InterviewError({ code: InterviewErrorCode.NoAnswer })
        const now = this.clock.now()
        const submitted: Array<SessionRow> = await this.entityManager.query(SUBMIT_SESSION, [learnerId, sessionId, now])
        if (submitted[0] === undefined) throw new InterviewError({ code: InterviewErrorCode.SessionClosed })
        await this.streak
            .recordStreakAction(learnerId, "interview", "interview-submitted", {
                actionId: sessionId,
                sourceRef: sessionId,
                at: now,
            })
            .catch((cause: unknown) => this.logger.error(InterviewLogEvent.StreakFailed, cause, { sessionId }))
        return this.grade(submitted[0])
    }

    /** Grades a session again after a failed grading; it never asks the learner to answer again. */
    async regrade(learnerId: string, sessionId: string): Promise<GradingView> {
        const found: Array<SessionRow> = await this.entityManager.query(SELECT_SESSION, [learnerId, sessionId])
        const session = found[0]
        if (session === undefined) throw new InterviewError({ code: InterviewErrorCode.SessionNotFound })
        if (session.status !== "failed" && session.status !== "submitted") {
            throw new InterviewError({ code: InterviewErrorCode.NothingToRetry })
        }
        return this.grade(session)
    }

    private async grade(session: SessionRow): Promise<GradingView> {
        const now = this.clock.now()
        const stale = new Date(now.getTime() - GRADING_STALE_MS)
        const claimed: Array<SessionRow> = await this.entityManager.query(CLAIM_GRADING, [
            session.learner_id,
            session.session_id,
            now,
            stale,
        ])
        const held = claimed[0]
        if (held === undefined) return this.current(session)
        try {
            await this.access.requireAiBudget(held.learner_id)
            return await this.complete(held)
        } catch (cause) {
            const code = cause instanceof InterviewError ? cause.code : InterviewErrorCode.CoachUnavailable
            this.logger.error(InterviewLogEvent.GradingFailed, cause, { sessionId: held.session_id, code })
            const failed: Array<SessionRow> = await this.entityManager.query(FAIL_GRADING, [
                held.session_id,
                code,
                this.clock.now(),
            ])
            return failed[0] === undefined ? this.current(held) : viewOf(failed[0])
        }
    }

    private async current(session: SessionRow): Promise<GradingView> {
        const rows: Array<SessionRow> = await this.entityManager.query(SELECT_SESSION, [
            session.learner_id,
            session.session_id,
        ])
        return viewOf(rows[0] ?? session)
    }

    private async complete(session: SessionRow): Promise<GradingView> {
        const turns: Array<TurnRow> = await this.entityManager.query(SELECT_TURNS, [session.session_id, LIST_ROWS_MAX])
        const material = await this.questions.gradingOf(session.questions)
        const locale = session.locale
        const reached = session.questions.flatMap((drawn) => {
            const mine = turns.filter((turn) => turn.position === drawn.position)
            const given = mine.filter((turn) => turn.role === "candidate")
            const row = material.find(
                (entry) => entry.question_id === drawn.questionId && entry.bank_version === drawn.bankVersion,
            )
            return given.length === 0 || row === undefined
                ? []
                : [{ drawn, mine, row, answered: given.some((turn) => turn.kind === "answer") }]
        })
        const toGrade: Array<GradingQuestion> = reached
            .filter((entry) => entry.answered)
            .map((entry) =>
                this.gradingQuestion(entry.drawn.position, entry.drawn.bodyLanguage, entry.row, entry.mine, locale),
            )
        const reply = await this.coach.grade({
            requestId: session.session_id,
            locale,
            questions: toGrade,
            previousProblem: null,
            timeoutMs: GRADING_TIMEOUT_MS,
        })
        const scoring: Array<ScoringQuestion> = reached.map((entry) => ({
            position: entry.drawn.position,
            questionId: entry.drawn.questionId,
            family: entry.drawn.family,
            material: entry.row.grading.locales[locale],
            idealAnswer: idealOf(entry.row.grading, entry.drawn.bodyLanguage, locale),
            moduleRefs: entry.row.module_refs,
            skipped: !entry.answered,
            hintsUsed: entry.mine.filter((turn) => turn.kind === "hint").length,
            graded: reply.questions.find((graded) => graded.position === entry.drawn.position) ?? null,
        }))
        const card = scorecardOf(scoring, this.settings.scoring)
        const done: Array<SessionRow> = await this.entityManager.query(COMPLETE_GRADING, [
            session.session_id,
            JSON.stringify(card),
            card.overallScore,
            card.verdict,
            card.technicalScore,
            card.technicalVerdict,
            card.behavioralScore,
            card.behavioralVerdict,
            JSON.stringify(reply.gradedBy),
            this.clock.now(),
        ])
        return done[0] === undefined ? this.current(session) : viewOf(done[0])
    }

    private gradingQuestion(
        position: number,
        language: string,
        row: QuestionGradingRow,
        turns: ReadonlyArray<TurnRow>,
        locale: InterviewLocale,
    ): GradingQuestion {
        return {
            position,
            questionId: row.question_id,
            family: row.family,
            kind: row.kind,
            prompt: promptOf(row.bodies, language, locale).prompt,
            material: row.grading.locales[locale],
            idealAnswer: idealOf(row.grading, language, locale),
            transcript: toTranscript(turns),
        }
    }
}
