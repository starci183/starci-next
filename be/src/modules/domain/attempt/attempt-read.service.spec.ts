import { mock, mockEntityManager } from "@starci/jest-preset"
import type { MockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { ATTEMPT_ID, LEARNER, activityProgressRowOf, attemptRowOf } from "@tests/fixtures/builders/attempt.builder"
import { LIST_ROWS_MAX, PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LessonReadService, type LessonView } from "@modules/domain/lesson"
import { AttemptReadService } from "./attempt-read.service"
import { AttemptError, AttemptErrorCode } from "./errors/attempt.error"
import { SELECT_ACTIVITY_PROGRESS, SELECT_ATTEMPT, SELECT_OUTCOMES } from "./persistence/attempt.sql"

const build = async (em: MockEntityManager, lessonFound = true) => {
    const lessons = mock<LessonReadService>()
    if (lessonFound) lessons.find.mockResolvedValue(mock<LessonView>())
    else lessons.find.mockRejectedValue(new AttemptError({ code: AttemptErrorCode.NotFound }))
    const moduleRef = await Test.createTestingModule({
        providers: [
            AttemptReadService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: LessonReadService, useValue: lessons },
        ],
    }).compile()
    return { service: moduleRef.get(AttemptReadService), lessons }
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
    it("assembles the outcome levels and the newest attempt of each activity, bounded", async () => {
        const em = mockEntityManager({
            query: [
                [SELECT_OUTCOMES, [{ outcome_id: "demo--o1", understood: 2, proved: 0 }]],
                [SELECT_ACTIVITY_PROGRESS, [activityProgressRowOf({ attempts: 2 })]],
            ],
        })
        const { service } = await build(em)

        const view = await service.progress({ learnerId: LEARNER, lessonId: "demo-lesson" })

        expect(view).toMatchObject({
            lessonId: "demo-lesson",
            version: "v1",
            phase: "predict",
            outcomes: [{ id: "demo--o1", understood: 2, proved: 0 }],
            attempts: { total: 2, activities: 1, graded: 1, failed: 0, pending: 0 },
        })
        expect(em.query).toHaveBeenCalledWith(SELECT_OUTCOMES, [LEARNER, "demo-lesson", LIST_ROWS_MAX])
        expect(em.query).toHaveBeenCalledWith(SELECT_ACTIVITY_PROGRESS, [LEARNER, "demo-lesson", LIST_ROWS_MAX])
    })

    it("is not found for a lesson that is not live, and reads nothing", async () => {
        const em = mockEntityManager()
        const { service } = await build(em, false)

        await expect(service.progress({ learnerId: LEARNER, lessonId: "no-lesson" })).rejects.toMatchObject({
            code: AttemptErrorCode.NotFound,
        })
        expect(em.query).not.toHaveBeenCalled()
    })

    it("checks the lesson is live before it reads", async () => {
        const em = mockEntityManager({
            query: [
                [SELECT_OUTCOMES, []],
                [SELECT_ACTIVITY_PROGRESS, []],
            ],
        })
        const { service, lessons } = await build(em)

        await service.progress({ learnerId: LEARNER, lessonId: "demo-lesson" })

        expect(lessons.find).toHaveBeenCalledWith({ id: "demo-lesson", locale: "vi", learnerId: LEARNER })
    })

    it("is empty before the first attempt", async () => {
        const { service } = await build(
            mockEntityManager({
                query: [
                    [SELECT_OUTCOMES, []],
                    [SELECT_ACTIVITY_PROGRESS, []],
                ],
            }),
        )

        await expect(service.progress({ learnerId: LEARNER, lessonId: "demo-lesson" })).resolves.toMatchObject({
            version: null,
            phase: "challenge",
            outcomes: [],
            activities: [],
        })
    })
})
