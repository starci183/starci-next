import { FakeClock, fakeTransaction, mock, mockEntityManager, type FakeTransaction } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import {
    ATTEMPT_ID,
    LEARNER,
    WRITTEN_ANSWER,
    answerOf,
    attemptRowOf,
    coachGradeOf,
    resultOf,
    submitParamsOf,
    writtenParamsOf,
    writtenRowOf,
} from "@tests/fixtures/builders/attempt.builder"
import {
    choiceActivityOf,
    exerciseActivityOf,
    explainActivityOf,
    retrievalActivityOf,
    simulationActivityOf,
} from "@tests/fixtures/builders/lesson.builder"
import {
    callsOf,
    choiceFound,
    explainFound,
    foundOf,
    gradedWritten,
    upsert,
    type QueryStub,
} from "@tests/fixtures/builders/attempt-stub.builder"
import { LessonContentService, type LessonActivity } from "@modules/domain/lesson"
import { ReviewScheduleService } from "@modules/domain/review"
import { StreakService } from "@modules/domain/streak"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { TIMER, type Timer } from "@modules/platform/retry"
import { ATTEMPT_COACH, type AttemptCoach } from "./attempt-coach.port"
import { AttemptFairUseService } from "./attempt-fair-use.service"
import type { AttemptServerActivity } from "./attempt.contracts"
import { AttemptLogEvent } from "./attempt.log-events"
import { AttemptService } from "./attempt.service"
import { gradeChoice } from "./choice-grading.policy"
import { AttemptError, AttemptErrorCode } from "./errors/attempt.error"
import type { ReplayRow } from "./persistence/attempt.rows"
import {
    CLAIM_GRADING,
    COMPLETE_GRADING,
    FAIL_GRADING,
    INSERT_ATTEMPT,
    SELECT_ATTEMPT,
    SELECT_REPLAY,
    UPSERT_OUTCOMES,
} from "./persistence/attempt.sql"
import { gradeRubric } from "./rubric-grading.policy"
import { gradeSimulation } from "./simulation-grading.policy"

const NOW = new Date("2026-11-08T10:00:00.000Z")
const STALE = new Date("2026-11-08T09:58:00.000Z")
const IDS = ["demo--o1", "demo--o2"]
const UNAVAILABLE = AttemptErrorCode.CoachUnavailable

const choiceStubs: ReadonlyArray<QueryStub> = [
    [INSERT_ATTEMPT, [attemptRowOf()]],
    [UPSERT_OUTCOMES, []],
]
const writtenStubs: ReadonlyArray<QueryStub> = [
    [INSERT_ATTEMPT, [writtenRowOf()]],
    [UPSERT_OUTCOMES, []],
    [CLAIM_GRADING, [writtenRowOf({ status: "grading" })]],
]
const withFailure = (code: string): ReadonlyArray<QueryStub> => [
    ...writtenStubs,
    [FAIL_GRADING, [writtenRowOf({ status: "failed", failure_code: code })]],
]

const build = async (queries: ReadonlyArray<QueryStub>, found: AttemptServerActivity) => {
    const tx: FakeTransaction = fakeTransaction(mockEntityManager({ query: queries }))
    const fairUse = mock<AttemptFairUseService>()
    fairUse.isWithinDailyLimit.mockResolvedValue(true)
    const content = mock<LessonContentService>()
    content.activity.mockResolvedValue(found)
    const coach = mock<AttemptCoach>()
    const cancel = jest.fn()
    const timer = mock<Timer>()
    timer.schedule.mockReturnValue(cancel)
    const logger = mock<Logger>()
    const streak = mock<StreakService>()
    const review = mock<ReviewScheduleService>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            AttemptService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: TIMER, useValue: timer },
            { provide: LOGGER, useValue: logger },
            { provide: ATTEMPT_COACH, useValue: coach },
            { provide: AttemptFairUseService, useValue: fairUse },
            { provide: LessonContentService, useValue: content },
            { provide: StreakService, useValue: streak },
            { provide: ReviewScheduleService, useValue: review },
        ],
    }).compile()
    return {
        service: moduleRef.get(AttemptService),
        tx,
        content,
        coach,
        timer,
        cancel,
        logger,
        fairUse,
        streak,
        review,
    }
}

describe("AttemptService submit of a choice", () => {
    it("stores the answer graded with every explanation, raises the outcome and never calls the coach", async () => {
        const { service, tx, content, coach } = await build(choiceStubs, choiceFound)

        expect(await service.submit(submitParamsOf())).toMatchObject({
            attemptId: ATTEMPT_ID,
            kind: "choice",
            phase: "predict",
            status: "graded",
        })
        expect(content.activity).toHaveBeenCalledWith({
            lessonId: "demo-lesson",
            version: "v1",
            activityId: "demo--predict",
            locale: "vi",
        })
        expect(content.requireAccess).toHaveBeenCalledWith({ learnerId: LEARNER, phase: "predict" })
        const answer = answerOf({ optionId: "demo--predict--1" })
        const graded = gradeChoice(choiceActivityOf("vi"), answer)
        expect(callsOf(tx, INSERT_ATTEMPT)).toEqual([
            [
                ...[LEARNER, "demo-lesson", "v1", "demo--predict", 1, "choice", "predict", "vi", false],
                ...[JSON.stringify(answer), "graded", JSON.stringify(graded), NOW, NOW],
            ],
        ])
        expect(callsOf(tx, UPSERT_OUTCOMES)).toEqual([upsert(["demo--o1"], 2, 0)])
        expect(tx.commits).toBe(1)
        expect(coach.grade).not.toHaveBeenCalled()
    })

    it("raises no outcome level for a wrong pick", async () => {
        const { service, tx } = await build(choiceStubs, choiceFound)

        await service.submit(submitParamsOf({ answer: answerOf({ optionId: "demo--predict--2" }) }))

        expect(callsOf(tx, UPSERT_OUTCOMES)).toEqual([upsert(["demo--o1"], 0, 0)])
    })
})

describe("AttemptService submit of a simulation", () => {
    const diagnostic: LessonActivity = { ...simulationActivityOf("vi"), isDiagnostic: true }

    it("validates the reported path, stores it graded and marks a diagnostic activity", async () => {
        const stubs: ReadonlyArray<QueryStub> = [
            [INSERT_ATTEMPT, [attemptRowOf({ kind: "simulation", phase: "explore" })]],
            [UPSERT_OUTCOMES, []],
        ]
        const { service, tx } = await build(stubs, foundOf(diagnostic, "explore"))
        const actionIds = ["demo--explore--a1", "demo--explore--a2"]

        await service.submit(
            submitParamsOf({
                activityId: "demo--explore",
                answer: answerOf({ actionIds, reachedStateId: "demo--explore--s2", debrief: " because " }),
            }),
        )

        const stored = answerOf({ actionIds, reachedStateId: "demo--explore--s2", debrief: "because" })
        const [insert] = callsOf(tx, INSERT_ATTEMPT)
        expect(insert?.slice(5, 12)).toEqual([
            "simulation",
            "explore",
            "vi",
            true,
            JSON.stringify(stored),
            "graded",
            JSON.stringify(gradeSimulation(diagnostic, stored)),
        ])
        expect(callsOf(tx, UPSERT_OUTCOMES)).toEqual([upsert(["demo--o1"], 0, 0)])
    })
})

describe("AttemptService submit of a written answer", () => {
    const stubs: ReadonlyArray<QueryStub> = [...writtenStubs, [COMPLETE_GRADING, [gradedWritten]]]

    it("saves first, takes it for grading, sends the coach the rubric and keeps the validated grade", async () => {
        const { service, tx, coach, timer, cancel } = await build(stubs, explainFound)
        coach.grade.mockResolvedValue(coachGradeOf())

        const view = await service.submit(writtenParamsOf())

        expect(view).toMatchObject({ status: "graded", activityId: "demo--interview", isDiagnostic: true })
        const request = coach.grade.mock.calls[0]?.[0]
        expect(request).toMatchObject({
            requestId: ATTEMPT_ID,
            locale: "vi",
            prompt: "vi: Explain how a read model goes stale.",
            kind: "explain",
            answerText: WRITTEN_ANSWER,
            files: [],
            timeoutMs: 60000,
        })
        expect(request?.rubric.map((criterion) => criterion.id)).toEqual(["demo--interview--c1", "demo--interview--c2"])
        const [insert] = callsOf(tx, INSERT_ATTEMPT)
        expect(insert?.slice(9)).toEqual([JSON.stringify(answerOf({ text: WRITTEN_ANSWER })), "saved", null, NOW, null])
        expect(callsOf(tx, CLAIM_GRADING)).toEqual([[ATTEMPT_ID, NOW, STALE]])
        const graded = gradeRubric(explainActivityOf("vi"), answerOf({ text: WRITTEN_ANSWER }), coachGradeOf())
        expect(callsOf(tx, COMPLETE_GRADING)).toEqual([[ATTEMPT_ID, JSON.stringify(graded), NOW]])
        expect(callsOf(tx, UPSERT_OUTCOMES)).toEqual([upsert(IDS, 0, 0), upsert(IDS, 0, 0)])
        expect(timer.schedule).toHaveBeenCalledTimes(1)
        expect(cancel).toHaveBeenCalledTimes(1)
    })

    it("sends an exercise with its files and proves the outcome of a non-diagnostic grade", async () => {
        const files = [{ relativePath: "log.txt", content: "red then green" }]
        const exercise = writtenRowOf({ kind: "exercise", answer: answerOf({ text: "done", files }) })
        const { service, tx, coach } = await build(
            [
                [INSERT_ATTEMPT, [exercise]],
                [UPSERT_OUTCOMES, []],
                [CLAIM_GRADING, [{ ...exercise, status: "grading" as const }]],
                [COMPLETE_GRADING, [{ ...exercise, status: "graded" as const, result: resultOf(), graded_at: NOW }]],
            ],
            foundOf(exerciseActivityOf("vi"), "apply"),
        )
        coach.grade.mockResolvedValue({
            criteria: [{ criterionId: "demo--practice--c1", level: 2, evidenceQuote: "red then green" }],
        })

        await service.submit(
            submitParamsOf({ activityId: "demo--practice", answer: answerOf({ text: "done", files }) }),
        )

        expect(coach.grade.mock.calls[0]?.[0]).toMatchObject({ kind: "exercise", answerText: "done", files })
        expect(callsOf(tx, UPSERT_OUTCOMES).at(-1)).toEqual(upsert(["demo--o2"], 2, 2))
    })

    it("reads a stored answer with no text as an empty text", async () => {
        const { service, coach } = await build(
            [
                ...stubs.slice(0, 2),
                [CLAIM_GRADING, [writtenRowOf({ status: "grading", answer: answerOf() })]],
                [COMPLETE_GRADING, [gradedWritten]],
            ],
            explainFound,
        )
        const zero = ["c1", "c2"].map((id) => ({ criterionId: `demo--interview--${id}`, level: 0, evidenceQuote: "" }))
        coach.grade.mockResolvedValue({ criteria: zero })

        await service.submit(writtenParamsOf())

        expect(coach.grade.mock.calls[0]?.[0].answerText).toBe("")
    })
})

describe("AttemptService submit when the coach does not grade", () => {
    it.each([
        [new AttemptError({ code: AttemptErrorCode.CoachUnconfigured }), AttemptErrorCode.CoachUnconfigured],
        [new Error("provider down"), UNAVAILABLE],
    ])("keeps the answer and fails with a stable code when the coach fails with %p", async (cause, code) => {
        const { service, tx, coach, logger, cancel } = await build(withFailure(code), explainFound)
        coach.grade.mockRejectedValue(cause)

        const view = await service.submit(writtenParamsOf())

        expect(view).toMatchObject({ status: "failed", failureCode: code, result: null })
        expect(callsOf(tx, FAIL_GRADING)).toEqual([[ATTEMPT_ID, code, NOW]])
        expect(callsOf(tx, COMPLETE_GRADING)).toEqual([])
        expect(logger.error).toHaveBeenCalledWith(AttemptLogEvent.GradingFailed, cause, {
            attemptId: ATTEMPT_ID,
            activityId: "demo--interview",
            code,
        })
        expect(cancel).toHaveBeenCalledTimes(1)
    })

    it("fails with the invalid code when the grade does not fit the rubric", async () => {
        const { service, coach } = await build(withFailure(AttemptErrorCode.CoachInvalid), explainFound)
        coach.grade.mockResolvedValue({ criteria: [] })

        await expect(service.submit(writtenParamsOf())).resolves.toMatchObject({
            status: "failed",
            failureCode: AttemptErrorCode.CoachInvalid,
        })
    })

    it("fails as unavailable when the coach does not answer before the deadline", async () => {
        const { service, coach, timer, tx } = await build(withFailure(UNAVAILABLE), explainFound)
        timer.schedule.mockImplementation((callback) => {
            callback()
            return jest.fn()
        })
        coach.grade.mockReturnValue(new Promise(() => undefined))

        expect(await service.submit(writtenParamsOf())).toMatchObject({ status: "failed", failureCode: UNAVAILABLE })
        expect(timer.schedule.mock.calls[0]?.[1]).toBe(60000)
        expect(callsOf(tx, FAIL_GRADING)).toEqual([[ATTEMPT_ID, UNAVAILABLE, NOW]])
    })

    it("fails as unavailable when the coach throws before it returns a promise", async () => {
        const { service, coach, cancel } = await build(withFailure(UNAVAILABLE), explainFound)
        coach.grade.mockImplementation(() => {
            throw new AttemptError({ code: UNAVAILABLE })
        })

        await expect(service.submit(writtenParamsOf())).resolves.toMatchObject({ status: "failed" })
        expect(cancel).not.toHaveBeenCalled()
    })
})

describe("AttemptService submit when another run holds the attempt", () => {
    const grading = writtenRowOf({ status: "grading" })
    const base: ReadonlyArray<QueryStub> = writtenStubs.slice(0, 2)

    it("answers the attempt as it stands when another run took it for grading", async () => {
        const { service, coach } = await build(
            [...base, [CLAIM_GRADING, []], [SELECT_ATTEMPT, [grading]]],
            explainFound,
        )

        await expect(service.submit(writtenParamsOf())).resolves.toMatchObject({ status: "grading" })
        expect(coach.grade).not.toHaveBeenCalled()
    })

    it("answers the stored attempt when the grade lands after another run already finished it", async () => {
        const stubs: ReadonlyArray<QueryStub> = [
            ...writtenStubs,
            [COMPLETE_GRADING, []],
            [SELECT_ATTEMPT, [gradedWritten]],
        ]
        const { service, coach } = await build(stubs, explainFound)
        coach.grade.mockResolvedValue(coachGradeOf())

        await expect(service.submit(writtenParamsOf())).resolves.toMatchObject({ status: "graded" })
    })

    it("answers the attempt as it stands when it was no longer being graded at the failure", async () => {
        const stubs: ReadonlyArray<QueryStub> = [...writtenStubs, [FAIL_GRADING, []], [SELECT_ATTEMPT, [gradedWritten]]]
        const { service, coach } = await build(stubs, explainFound)
        coach.grade.mockRejectedValue(new Error("late"))

        await expect(service.submit(writtenParamsOf())).resolves.toMatchObject({ status: "graded" })
    })

    it("fails with NotSaved when the attempt cannot be read back", async () => {
        const { service } = await build([...base, [CLAIM_GRADING, []], [SELECT_ATTEMPT, []]], explainFound)

        await expect(service.submit(writtenParamsOf())).rejects.toMatchObject({ code: AttemptErrorCode.NotSaved })
    })
})

describe("AttemptService submit that is refused before anything is stored", () => {
    it.each([
        ["a review activity", retrievalActivityOf("vi"), submitParamsOf({ activityId: "demo--review" })],
        ["a supported kind that sits in the review phase", explainActivityOf("vi"), writtenParamsOf()],
    ])("refuses %s before the access check", async (_name, activity, params) => {
        const { service, content } = await build([], foundOf(activity, "retrieval"))

        await expect(service.submit(params)).rejects.toMatchObject({ code: AttemptErrorCode.ActivityUnsupported })
        expect(content.requireAccess).not.toHaveBeenCalled()
    })

    it.each([
        [
            "an option the activity does not list",
            choiceFound,
            [],
            submitParamsOf({ answer: answerOf({ optionId: "demo--predict--9" }) }),
        ],
        [
            "a path the state machine does not allow",
            foundOf(simulationActivityOf("vi"), "explore"),
            [],
            submitParamsOf({
                activityId: "demo--explore",
                answer: answerOf({ actionIds: ["demo--explore--a2"], reachedStateId: "demo--explore--s2" }),
            }),
        ],
        ["an answer with no text", explainFound, writtenStubs, writtenParamsOf({ answer: answerOf({ text: "  " }) })],
    ])("refuses %s and stores nothing", async (_name, found, queries, params) => {
        const { service, tx } = await build(queries, found)

        await expect(service.submit(params)).rejects.toMatchObject({ code: AttemptErrorCode.AnswerInvalid })
        expect(tx.em.query).not.toHaveBeenCalled()
    })

    it("asks the coach for nothing when Premium is required", async () => {
        const { service, tx, content, coach } = await build(writtenStubs, foundOf(explainActivityOf("vi"), "reflect"))
        content.requireAccess.mockRejectedValue(new AttemptError({ code: AttemptErrorCode.NotFound }))

        await expect(service.submit(writtenParamsOf())).rejects.toMatchObject({ code: AttemptErrorCode.NotFound })

        expect(content.requireAccess).toHaveBeenCalledWith({ learnerId: LEARNER, phase: "reflect" })
        expect(tx.em.query).not.toHaveBeenCalled()
        expect(coach.grade).not.toHaveBeenCalled()
    })
})

describe("AttemptService submit of a resend", () => {
    const replayOf = (overrides: Partial<ReplayRow> = {}): ReplayRow => ({
        ...attemptRowOf(),
        same_answer: true,
        ...overrides,
    })
    const replaying = (row: ReplayRow | null): ReadonlyArray<QueryStub> => [
        [INSERT_ATTEMPT, []],
        [SELECT_REPLAY, row === null ? [] : [row]],
    ]

    it("answers the stored graded attempt with no second attempt and no outcome write", async () => {
        const { service, tx, coach } = await build(replaying(replayOf()), choiceFound)

        expect(await service.submit(submitParamsOf())).toMatchObject({ attemptId: ATTEMPT_ID, status: "graded" })
        const answer = JSON.stringify(answerOf({ optionId: "demo--predict--1" }))
        expect(callsOf(tx, SELECT_REPLAY)).toEqual([[LEARNER, "demo-lesson", "v1", "demo--predict", 1, answer]])
        expect(callsOf(tx, UPSERT_OUTCOMES)).toEqual([])
        expect(coach.grade).not.toHaveBeenCalled()
    })

    it.each([
        [
            "refuses the same revision with another answer",
            replayOf({ same_answer: false }),
            AttemptErrorCode.RevisionConflict,
        ],
        ["fails with NotSaved when the revision is neither inserted nor found", null, AttemptErrorCode.NotSaved],
    ])("%s", async (_name, row, code) => {
        const { service } = await build(replaying(row), choiceFound)

        await expect(service.submit(submitParamsOf())).rejects.toMatchObject({ code })
    })

    it("grades a failed written answer again", async () => {
        const failed = { ...writtenRowOf({ status: "failed", failure_code: UNAVAILABLE }), same_answer: true }
        const stubs: ReadonlyArray<QueryStub> = [
            ...replaying(failed),
            [CLAIM_GRADING, [writtenRowOf({ status: "grading" })]],
            [COMPLETE_GRADING, [gradedWritten]],
            [UPSERT_OUTCOMES, []],
        ]
        const { service, tx, coach } = await build(stubs, explainFound)
        coach.grade.mockResolvedValue(coachGradeOf())

        const view = await service.submit(writtenParamsOf())

        expect(view.status).toBe("graded")
        expect(coach.grade).toHaveBeenCalledTimes(1)
        expect(callsOf(tx, CLAIM_GRADING)).toEqual([[ATTEMPT_ID, NOW, STALE]])
    })
})

describe("AttemptService fair use and producers", () => {
    it("fails with the limit code, keeps the answer, never calls the coach and tells nobody", async () => {
        const code = AttemptErrorCode.CoachLimitReached
        const { service, coach, fairUse, streak, review } = await build(withFailure(code), explainFound)
        fairUse.isWithinDailyLimit.mockResolvedValue(false)

        expect(await service.submit(writtenParamsOf())).toMatchObject({
            status: "failed",
            failureCode: "ATTEMPT_COACH_LIMIT_REACHED",
            result: null,
        })
        expect(fairUse.isWithinDailyLimit).toHaveBeenCalledWith(LEARNER)
        expect(coach.grade).not.toHaveBeenCalled()
        expect(streak.recordStreakAction).not.toHaveBeenCalled()
        expect(review.onActivityGraded).not.toHaveBeenCalled()
    })

    it("records one graded attempt for the streak and tells review once a choice is stored graded", async () => {
        const { service, streak, review } = await build(choiceStubs, choiceFound)

        await service.submit(submitParamsOf())

        expect(streak.recordStreakAction).toHaveBeenCalledWith(LEARNER, "essentials", "graded-attempt", {
            actionId: `attempt:${ATTEMPT_ID}`,
            sourceRef: ATTEMPT_ID,
        })
        expect(review.onActivityGraded).toHaveBeenCalledWith(LEARNER, "demo-lesson", "v1")
    })

    it("keeps the attempt graded when the streak cannot be told", async () => {
        const { service, streak, logger } = await build(choiceStubs, choiceFound)
        streak.recordStreakAction.mockRejectedValue(new Error("down"))

        const view = await service.submit(submitParamsOf())

        expect(view.status).toBe("graded")
        expect(logger.error).toHaveBeenCalledWith(AttemptLogEvent.AfterGradedFailed, expect.anything(), {
            attemptId: ATTEMPT_ID,
        })
    })
})
