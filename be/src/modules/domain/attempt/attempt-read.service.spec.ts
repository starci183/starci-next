import { mock, mockEntityManager } from "@starci/jest-preset"
import type { MockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import {
    ATTEMPT_ID,
    LEARNER,
    activityProgressRowOf,
    attemptRowOf,
    resultOf,
} from "@tests/fixtures/builders/attempt.builder"
import type { QueryStub } from "@tests/fixtures/builders/attempt-stub.builder"
import { LIST_ROWS_MAX, PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LessonContentService, LessonReadService, type LessonOutline, type LessonView } from "@modules/domain/lesson"
import { ReviewScheduleService } from "@modules/domain/review"
import { AttemptReadService } from "./attempt-read.service"
import { AttemptError, AttemptErrorCode } from "./errors/attempt.error"
import {
    SELECT_ACTIVITY_PROGRESS,
    SELECT_ATTEMPT,
    SELECT_COMPLETION,
    SELECT_OUTCOMES,
    SELECT_SIMULATION_PROGRESS,
} from "./persistence/attempt.sql"

/** A lesson with one outcome, a predict choice, an apply exercise and a reflect explain, all training that outcome. */
const OUTLINE: LessonOutline = {
    outcomeIds: ["demo--o1"],
    activities: [
        {
            id: "demo--predict",
            kind: "choice",
            phase: "predict",
            isDiagnostic: false,
            outcomeIds: ["demo--o1"],
            expectedEvidence: {},
        },
        {
            id: "demo--apply",
            kind: "exercise",
            phase: "apply",
            isDiagnostic: false,
            outcomeIds: ["demo--o1"],
            expectedEvidence: { c1: "names the key" },
        },
        {
            id: "demo--reflect",
            kind: "explain",
            phase: "reflect",
            isDiagnostic: false,
            outcomeIds: ["demo--o1"],
            expectedEvidence: {},
        },
    ],
}

const build = async (em: MockEntityManager, lessonFound = true) => {
    const lessons = mock<LessonReadService>()
    const content = mock<LessonContentService>()
    content.outline.mockResolvedValue(OUTLINE)
    const review = mock<ReviewScheduleService>()
    review.lessonSchedule.mockResolvedValue([{ activityId: "r1", afterDays: 1, dueOn: "2026-11-12", done: false }])
    if (lessonFound) lessons.find.mockResolvedValue(mock<LessonView>({ version: "v1" }))
    else lessons.find.mockRejectedValue(new AttemptError({ code: AttemptErrorCode.NotFound }))
    const moduleRef = await Test.createTestingModule({
        providers: [
            AttemptReadService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: LessonReadService, useValue: lessons },
            { provide: LessonContentService, useValue: content },
            { provide: ReviewScheduleService, useValue: review },
        ],
    }).compile()
    return { service: moduleRef.get(AttemptReadService), lessons, content, review }
}

const rowsFor = (...overrides: Array<QueryStub>): Array<QueryStub> => {
    const defaults: Array<QueryStub> = [
        [SELECT_OUTCOMES, []],
        [SELECT_ACTIVITY_PROGRESS, []],
        [SELECT_COMPLETION, []],
        [SELECT_SIMULATION_PROGRESS, []],
    ]
    return defaults.map((entry) => overrides.find((over) => over[0] === entry[0]) ?? entry)
}

describe("AttemptReadService find", () => {
    it("answers the attempt of the learner as a view, scoped to the learner", async () => {
        const em = mockEntityManager({ query: [SELECT_ATTEMPT, [attemptRowOf()]] })
        const { service } = await build(em)

        const view = await service.find({ learnerId: LEARNER, attemptId: ATTEMPT_ID })

        expect(view).toMatchObject({ attemptId: ATTEMPT_ID, status: "graded", activityId: "demo--predict" })
        expect(em.query).toHaveBeenCalledWith(SELECT_ATTEMPT, [LEARNER, ATTEMPT_ID])
    })

    it("does not find an attempt of another learner or one that does not exist", async () => {
        const { service } = await build(mockEntityManager({ query: [SELECT_ATTEMPT, []] }))

        await expect(service.find({ learnerId: LEARNER, attemptId: ATTEMPT_ID })).rejects.toMatchObject({
            code: AttemptErrorCode.NotFound,
        })
    })
})

describe("AttemptReadService progress", () => {
    it("assembles the whole newest attempt of each activity, the phases and the outcomes, bounded", async () => {
        const em = mockEntityManager({
            query: rowsFor(
                [SELECT_OUTCOMES, [{ outcome_id: "demo--o1", understood: 2, proved: 0 }]],
                [SELECT_ACTIVITY_PROGRESS, [activityProgressRowOf({ attempts: 2 })]],
            ),
        })
        const { service } = await build(em)

        const view = await service.progress({ learnerId: LEARNER, lessonId: "demo-lesson" })

        expect(view).toMatchObject({
            lessonId: "demo-lesson",
            version: "v1",
            phase: "predict",
            completedAt: null,
            reviews: [],
            outcomes: [{ id: "demo--o1", understood: 2, proved: 0, state: "learning" }],
            attempts: { total: 2, activities: 1, graded: 1, failed: 0, pending: 0 },
            activities: [{ activityId: "demo--predict", latest: { attemptId: ATTEMPT_ID, status: "graded" } }],
        })
        expect(view.phases.map((phase) => `${phase.phase}:${phase.state}`)).toEqual([
            "challenge:done",
            "predict:done",
            "explore:open",
            "explain:open",
            "apply:open",
            "reflect:open",
        ])
        expect(em.query).toHaveBeenCalledWith(SELECT_OUTCOMES, [LEARNER, "demo-lesson", LIST_ROWS_MAX])
        expect(em.query).toHaveBeenCalledWith(SELECT_ACTIVITY_PROGRESS, [LEARNER, "demo-lesson", LIST_ROWS_MAX])
    })

    it("marks the outcome mastered once apply and reflect are graded at 4 of 6 or more", async () => {
        const graded = (activityId: string, phase: "apply" | "reflect", score: number) =>
            activityProgressRowOf({ activity_id: activityId, phase, result: resultOf({ score, maxScore: 6 }) })
        const em = mockEntityManager({
            query: rowsFor([
                SELECT_ACTIVITY_PROGRESS,
                [graded("demo--apply", "apply", 4), graded("demo--reflect", "reflect", 5)],
            ]),
        })
        const { service } = await build(em)

        const view = await service.progress({ learnerId: LEARNER, lessonId: "demo-lesson" })

        expect(view.outcomes).toEqual([{ id: "demo--o1", understood: 0, proved: 0, state: "mastered" }])
    })
})

describe("AttemptReadService progress of a finished lesson", () => {
    it("reads the completion and the reviews it opened, and needs review when the end left the outcome unproved", async () => {
        const em = mockEntityManager({
            query: rowsFor(
                [SELECT_COMPLETION, [{ lesson_version: "v1", completed_at: new Date("2026-11-11T08:00:00.000Z") }]],
                [
                    SELECT_ACTIVITY_PROGRESS,
                    [
                        activityProgressRowOf({
                            activity_id: "demo--apply",
                            phase: "apply",
                            result: resultOf({ score: 3, maxScore: 6 }),
                        }),
                    ],
                ],
            ),
        })
        const { service, review } = await build(em)

        const view = await service.progress({ learnerId: LEARNER, lessonId: "demo-lesson" })

        expect(view.completedAt).toBe("2026-11-11T08:00:00.000Z")
        expect(view.reviews).toEqual([{ activityId: "r1", afterDays: 1, dueOn: "2026-11-12", done: false }])
        expect(view.outcomes[0]?.state).toBe("needs-review")
        expect(review.lessonSchedule).toHaveBeenCalledWith(LEARNER, "demo-lesson")
    })

    it("lists no reviews when the review module is not present", async () => {
        const em = mockEntityManager({
            query: rowsFor([
                SELECT_COMPLETION,
                [{ lesson_version: "v1", completed_at: new Date("2026-11-11T08:00:00.000Z") }],
            ]),
        })
        const { service, review } = await build(em)
        review.lessonSchedule.mockReset()

        const view = await service.progress({ learnerId: LEARNER, lessonId: "demo-lesson" })

        expect(view.reviews).toEqual([])
    })
})

describe("AttemptReadService progress of the stored grades", () => {
    it("leaves the grade of an activity the outline does not hold as stored", async () => {
        const em = mockEntityManager({
            query: rowsFor([
                SELECT_ACTIVITY_PROGRESS,
                [
                    activityProgressRowOf({
                        activity_id: "demo--gone",
                        phase: "apply",
                        result: resultOf({ score: 1, maxScore: 2 }),
                    }),
                ],
            ]),
        })
        const { service } = await build(em)

        const view = await service.progress({ learnerId: LEARNER, lessonId: "demo-lesson" })

        expect(view.activities[0]?.latest.result?.score).toBe(1)
    })

    it("completes the note of a grade stored before notes with the expected evidence of the rubric", async () => {
        const legacy = {
            ...resultOf({ score: 1, maxScore: 2 }),
            criteria: [{ criterionId: "c1", criterion: "C", level: 1, evidenceQuote: "q", maxScore: 2 }],
        }
        const em = mockEntityManager({
            query: rowsFor([
                SELECT_ACTIVITY_PROGRESS,
                [activityProgressRowOf({ activity_id: "demo--apply", phase: "apply", result: legacy })],
            ]),
        })
        const { service } = await build(em)

        const view = await service.progress({ learnerId: LEARNER, lessonId: "demo-lesson" })

        expect(view.activities[0]?.latest.result?.criteria[0]?.missing).toBe("names the key")
    })

    it("reads the outline of the version of the newest attempt, in the asked locale", async () => {
        const em = mockEntityManager({
            query: rowsFor([SELECT_ACTIVITY_PROGRESS, [activityProgressRowOf({ lesson_version: "v7" })]]),
        })
        const { service, content } = await build(em)

        await service.progress({ learnerId: LEARNER, lessonId: "demo-lesson", locale: "en" })

        expect(content.outline).toHaveBeenCalledWith("demo-lesson", "v7", "en")
    })
})

describe("AttemptReadService progress of a lesson", () => {
    it("is not found for a lesson that is not live, and reads nothing", async () => {
        const em = mockEntityManager()
        const { service } = await build(em, false)

        await expect(service.progress({ learnerId: LEARNER, lessonId: "no-lesson" })).rejects.toMatchObject({
            code: AttemptErrorCode.NotFound,
        })
        expect(em.query).not.toHaveBeenCalled()
    })

    it("checks the lesson is live before it reads", async () => {
        const { service, lessons } = await build(mockEntityManager({ query: rowsFor() }))

        await service.progress({ learnerId: LEARNER, lessonId: "demo-lesson" })

        expect(lessons.find).toHaveBeenCalledWith({ id: "demo-lesson", locale: "vi", learnerId: LEARNER })
    })

    it("is empty before the first attempt, on the live version, with every outcome not started", async () => {
        const { service } = await build(mockEntityManager({ query: rowsFor() }))

        await expect(service.progress({ learnerId: LEARNER, lessonId: "demo-lesson" })).resolves.toMatchObject({
            version: null,
            phase: "challenge",
            outcomes: [{ id: "demo--o1", understood: 0, proved: 0, state: "not-started" }],
            activities: [],
        })
    })
})
