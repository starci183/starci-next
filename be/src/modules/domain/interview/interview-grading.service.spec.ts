import { DEFAULT_INTERVIEW_SETTINGS } from "./interview.config"
import type { InterviewSettings } from "./interview.options"
import { FakeClock, mock, mockEntityManager, builder } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import {
    LEARNER,
    SESSION,
    behavioralDraftOf,
    gradedTechnicalOf,
    questionDraftOf,
    sessionRowOf,
    turnRowOf,
} from "@tests/fixtures/builders/interview.builder"
import { StreakService } from "@modules/domain/streak"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { InterviewError, InterviewErrorCode } from "./errors/interview.error"
import { InterviewAccessService } from "./interview-access.service"
import { INTERVIEW_COACH, type InterviewCoach } from "./interview-coach.port"
import { InterviewGradingService } from "./interview-grading.service"
import { InterviewQuestionService } from "./interview-question.service"
import { INTERVIEW_RESOLVED_OPTIONS } from "./interview.decorators"
import { InterviewLogEvent } from "./interview.log-events"
import type { QuestionGradingRow, SessionRow, TurnRow } from "./persistence/interview.rows"
import type { InterviewStatus, TurnKind } from "./interview.contracts"
import {
    CLAIM_GRADING,
    COMPLETE_GRADING,
    FAIL_GRADING,
    SELECT_SESSION,
    SELECT_TURNS,
    SUBMIT_SESSION,
} from "./persistence/interview.sql"
import { LAYER_IDEAL_VI, LAYER_QUESTION_VI, SKIPPED_ANSWER_VI } from "@tests/fixtures/i18n/interview-spec.messages"
import { firstParamsOf, storedCardOf, storedJsonOf } from "@tests/fixtures/builders/interview-stub.builder"

const NOW = new Date("2026-11-08T10:00:00.000Z")
const technical = questionDraftOf()
const behavioral = behavioralDraftOf()

const gradingRows: Array<QuestionGradingRow> = [
    {
        bank_id: "0-fullstack-mastery/0-framework-foundation",
        bank_version: "v1",
        question_id: technical.questionId,
        family: "technical",
        kind: "theory",
        bodies: technical.bodies,
        grading: technical.grading,
        module_refs: ["0-core"],
    },
    {
        bank_id: "eq/1-behavioral",
        bank_version: "v1",
        question_id: "eq/1-behavioral/0",
        family: "behavioral",
        kind: "behavioral",
        bodies: behavioral.bodies,
        grading: behavioral.grading,
        module_refs: [],
    },
]

const turn = (
    seq: number,
    position: number,
    role: "interviewer" | "candidate",
    kind: TurnKind,
    content: string,
): TurnRow => turnRowOf({ seq, position, role, kind, content, revision: role === "candidate" ? 0 : null })

const FULL: ReadonlyArray<TurnRow> = [
    turn(0, 0, "interviewer", "prompt", "Q1"),
    turn(1, 0, "interviewer", "hint", "a hint"),
    turn(2, 0, "candidate", "answer", "put it in the service"),
    turn(3, 1, "interviewer", "prompt", "Q2"),
    turn(4, 1, "candidate", "skip", SKIPPED_ANSWER_VI),
    turn(5, 1, "interviewer", "done", "bye"),
]

/** The session states from which a regrade has nothing to retry. */
const NO_RETRY_STATUSES: ReadonlyArray<InterviewStatus> = ["active", "graded", "grading", "abandoned"]

const isSequence = (value: unknown): value is { readonly seq: ReadonlyArray<unknown> } =>
    typeof value === "object" && value !== null && "seq" in value

const graded = (over: object = {}) => sessionRowOf({ status: "graded", ...over })

const build = async (
    session: SessionRow,
    turns: ReadonlyArray<TurnRow>,
    stubs: Readonly<Record<string, unknown>> = {},
) => {
    const em = mockEntityManager({
        query: Object.entries({
            [SELECT_SESSION]: [session],
            [SELECT_TURNS]: turns,
            [SUBMIT_SESSION]: [sessionRowOf({ status: "submitted" })],
            [CLAIM_GRADING]: [sessionRowOf({ status: "grading" })],
            [COMPLETE_GRADING]: [graded()],
            [FAIL_GRADING]: [sessionRowOf({ status: "failed", failure_code: "INTERVIEW_COACH_UNAVAILABLE" })],
            ...stubs,
        }).flatMap(([statement, rows]) =>
            isSequence(rows) ? rows.seq.map((answer) => [statement, answer] as const) : [[statement, rows] as const],
        ),
    })
    const access = mock<InterviewAccessService>()
    access.requireAiBudget.mockResolvedValue(undefined)
    const questions = mock<InterviewQuestionService>()
    questions.gradingOf.mockResolvedValue(gradingRows)
    const coach = mock<InterviewCoach>()
    coach.grade.mockResolvedValue({
        questions: [gradedTechnicalOf()],
        gradedBy: { profile: "interview", model: "pro", usedFallback: false },
    })
    const streak = mock<StreakService>()
    streak.recordStreakAction.mockResolvedValue({ counted: true, day: "2026-11-08" })
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            InterviewGradingService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: LOGGER, useValue: logger },
            { provide: INTERVIEW_COACH, useValue: coach },
            { provide: INTERVIEW_RESOLVED_OPTIONS, useValue: builder<InterviewSettings>(DEFAULT_INTERVIEW_SETTINGS)() },
            { provide: InterviewAccessService, useValue: access },
            { provide: InterviewQuestionService, useValue: questions },
            { provide: StreakService, useValue: streak },
        ],
    }).compile()
    return { service: moduleRef.get(InterviewGradingService), em, access, questions, coach, streak, logger }
}

describe("InterviewGradingService submit", () => {
    it("ends the interview, reports the streak action once, grades the whole session once and stores the scorecard computed on the server", async () => {
        const { service, em, coach, streak, access } = await build(sessionRowOf(), FULL)

        await expect(service.submit(LEARNER, SESSION)).resolves.toEqual({
            sessionId: SESSION,
            status: "graded",
            failureCode: null,
        })

        expect(streak.recordStreakAction).toHaveBeenCalledWith(LEARNER, "interview", "interview-submitted", {
            actionId: SESSION,
            sourceRef: SESSION,
            at: NOW,
        })
        expect(access.requireAiBudget).toHaveBeenCalledTimes(1)
        expect(coach.grade).toHaveBeenCalledTimes(1)
        const request = coach.grade.mock.calls[0]?.[0]
        expect(request?.questions.map((question) => question.position)).toEqual([0])
        expect(request?.questions[0]?.transcript.map((line) => line.kind)).toEqual(["prompt", "answer"])
        expect(request?.questions[0]).toMatchObject({
            idealAnswer: LAYER_IDEAL_VI,
            prompt: LAYER_QUESTION_VI,
        })
        const stored = firstParamsOf(em, COMPLETE_GRADING)
        const card = storedCardOf(stored, 1)
        expect(
            card.questions.map((question) => [
                question.position,
                question.skipped,
                question.score,
                question.hintsUsed,
                question.hintPenalty,
            ]),
        ).toEqual([
            [0, false, 55, 1, 5],
            [1, true, 0, 0, 0],
        ])
        expect(stored.slice(2, 4)).toEqual([card.overallScore, card.verdict])
        expect(storedJsonOf(stored, 8)).toEqual({ profile: "interview", model: "pro", usedFallback: false })
    })

    it("still grades when the streak cannot record the action", async () => {
        const { service, streak, logger } = await build(sessionRowOf(), FULL)
        streak.recordStreakAction.mockRejectedValue(new Error("down"))

        await expect(service.submit(LEARNER, SESSION)).resolves.toMatchObject({ status: "graded" })
        expect(logger.error).toHaveBeenCalledWith(InterviewLogEvent.StreakFailed, expect.anything(), {
            sessionId: SESSION,
        })
    })

    it("does not find another learner's session, refuses a closed one and one with no answer, and a lost race", async () => {
        const gone = await build(sessionRowOf(), FULL, { [SELECT_SESSION]: [] })
        const closed = await build(sessionRowOf({ status: "graded" }), FULL)
        const empty = await build(
            sessionRowOf(),
            FULL.filter((_row, index) => index === 0 || index === 4),
        )
        const raced = await build(sessionRowOf(), FULL, { [SUBMIT_SESSION]: [] })

        await expect(gone.service.submit(LEARNER, SESSION)).rejects.toMatchObject({
            code: "INTERVIEW_SESSION_NOT_FOUND",
        })
        await expect(closed.service.submit(LEARNER, SESSION)).rejects.toMatchObject({
            code: "INTERVIEW_SESSION_CLOSED",
        })
        await expect(empty.service.submit(LEARNER, SESSION)).rejects.toMatchObject({ code: "INTERVIEW_NO_ANSWER" })
        await expect(raced.service.submit(LEARNER, SESSION)).rejects.toMatchObject({ code: "INTERVIEW_SESSION_CLOSED" })
        expect(empty.streak.recordStreakAction).not.toHaveBeenCalled()
        expect(empty.coach.grade).not.toHaveBeenCalled()
    })

    it("answers the session as it stands when another run already holds the grading", async () => {
        const { service, coach } = await build(sessionRowOf({ status: "active" }), FULL, { [CLAIM_GRADING]: [] })

        await expect(service.submit(LEARNER, SESSION)).resolves.toMatchObject({ sessionId: SESSION, status: "active" })
        expect(coach.grade).not.toHaveBeenCalled()
    })
})

describe("InterviewGradingService an interview ended early", () => {
    it("grades only the questions the learner reached", async () => {
        const { service, coach, em } = await build(sessionRowOf(), FULL.slice(0, 3))

        await service.submit(LEARNER, SESSION)

        expect(coach.grade.mock.calls[0]?.[0].questions).toHaveLength(1)
        expect(storedCardOf(firstParamsOf(em, COMPLETE_GRADING), 1).questions).toHaveLength(1)
    })

    it("leaves out a question whose stored material cannot be found", async () => {
        const { service, questions, coach } = await build(sessionRowOf(), FULL)
        questions.gradingOf.mockResolvedValue([])

        await service.submit(LEARNER, SESSION)

        expect(coach.grade.mock.calls[0]?.[0].questions).toEqual([])
    })
})

describe("InterviewGradingService a failed grading", () => {
    it("keeps the transcript and marks the session failed with the code of the coach", async () => {
        const { service, coach, em } = await build(sessionRowOf(), FULL)
        coach.grade.mockRejectedValue(new InterviewError({ code: InterviewErrorCode.CoachInvalid }))

        await expect(service.submit(LEARNER, SESSION)).resolves.toEqual({
            sessionId: SESSION,
            status: "failed",
            failureCode: "INTERVIEW_COACH_UNAVAILABLE",
        })
        expect(em.query).toHaveBeenCalledWith(FAIL_GRADING, [SESSION, "INTERVIEW_COACH_INVALID", NOW])
    })

    it("fails as unavailable for a failure that is not the interview's own, and over the daily cap without asking the model", async () => {
        const unknown = await build(sessionRowOf(), FULL)
        unknown.coach.grade.mockRejectedValue(new Error("boom"))
        const capped = await build(sessionRowOf(), FULL)
        capped.access.requireAiBudget.mockRejectedValue(new InterviewError({ code: InterviewErrorCode.AiLimitReached }))

        await unknown.service.submit(LEARNER, SESSION)
        await capped.service.submit(LEARNER, SESSION)

        expect(unknown.em.query).toHaveBeenCalledWith(FAIL_GRADING, [SESSION, "INTERVIEW_COACH_UNAVAILABLE", NOW])
        expect(capped.em.query).toHaveBeenCalledWith(FAIL_GRADING, [SESSION, "INTERVIEW_AI_LIMIT_REACHED", NOW])
        expect(capped.coach.grade).not.toHaveBeenCalled()
    })

    it("answers the session as it stands when it is no longer being graded, when failing and when completing", async () => {
        const failing = await build(sessionRowOf({ status: "failed", failure_code: "X" }), FULL, { [FAIL_GRADING]: [] })
        failing.coach.grade.mockRejectedValue(new Error("boom"))
        const completing = await build(sessionRowOf({ status: "failed", failure_code: "X" }), FULL, {
            [COMPLETE_GRADING]: [],
            [SELECT_SESSION]: { seq: [[sessionRowOf({ status: "failed", failure_code: "X" })], [graded()]] },
        })
        const missing = await build(sessionRowOf({ status: "failed", failure_code: "X" }), FULL, {
            [CLAIM_GRADING]: [],
            [SELECT_SESSION]: { seq: [[sessionRowOf({ status: "failed", failure_code: "X" })], []] },
        })

        await expect(failing.service.regrade(LEARNER, SESSION)).resolves.toMatchObject({ sessionId: SESSION })
        await expect(completing.service.regrade(LEARNER, SESSION)).resolves.toMatchObject({ status: "graded" })
        await expect(missing.service.regrade(LEARNER, SESSION)).resolves.toMatchObject({
            sessionId: SESSION,
            status: "failed",
        })
    })
})

describe("InterviewGradingService regrade", () => {
    it("grades a failed session again from the stored transcript", async () => {
        const { service, coach } = await build(sessionRowOf({ status: "failed", failure_code: "X" }), FULL)

        await expect(service.regrade(LEARNER, SESSION)).resolves.toMatchObject({ status: "graded" })
        expect(coach.grade).toHaveBeenCalledTimes(1)
    })

    it("grades a session that stayed submitted", async () => {
        const { service } = await build(sessionRowOf({ status: "submitted" }), FULL)

        await expect(service.regrade(LEARNER, SESSION)).resolves.toMatchObject({ status: "graded" })
    })

    it.each(NO_RETRY_STATUSES)("has nothing to retry for a %s session", async (status) => {
        const { service } = await build(sessionRowOf({ status }), FULL)

        await expect(service.regrade(LEARNER, SESSION)).rejects.toMatchObject({ code: "INTERVIEW_NOTHING_TO_RETRY" })
    })

    it("does not find a session that is not the learner's", async () => {
        const { service } = await build(sessionRowOf(), FULL, { [SELECT_SESSION]: [] })

        await expect(service.regrade(LEARNER, SESSION)).rejects.toMatchObject({ code: "INTERVIEW_SESSION_NOT_FOUND" })
    })
})
