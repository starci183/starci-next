import { FakeClock, mock, mockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { REVIEW_LEARNER } from "@tests/fixtures/builders/review.builder"
import { LessonContentService } from "@modules/domain/lesson"
import type { LessonPlan } from "@modules/domain/lesson"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { INSERT_RETRIEVAL_STATE, SELECT_GRADED_ACTIVITIES } from "./persistence/review.sql"
import { ReviewScheduleService } from "./review-schedule.service"

const NOW = new Date("2026-11-08T03:00:00.000Z")

const PLAN: LessonPlan = {
    required: ["a1", "a2"],
    retrieval: [
        { activityId: "r1", afterDays: 1 },
        { activityId: "r7", afterDays: 7 },
        { activityId: "r21", afterDays: 21 },
    ],
}

const build = async (plan: LessonPlan, graded: ReadonlyArray<string>, created = true) => {
    const content = mock<LessonContentService>()
    content.plan.mockResolvedValue(plan)
    const em = mockEntityManager({
        query: [
            [SELECT_GRADED_ACTIVITIES, graded.map((activity_id) => ({ activity_id }))],
            [INSERT_RETRIEVAL_STATE, created ? [{ item_id: "x" }] : []],
        ],
    })
    const moduleRef = await Test.createTestingModule({
        providers: [
            ReviewScheduleService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: LessonContentService, useValue: content },
        ],
    }).compile()
    return { service: moduleRef.get(ReviewScheduleService), em }
}

describe("ReviewScheduleService enqueueLesson", () => {
    it("gives the learner one retrieval item per authored day, due that many days after the completion day", async () => {
        const { service, em } = await build(PLAN, [])

        const count = await service.enqueueLesson(
            REVIEW_LEARNER,
            "demo-lesson",
            "v1",
            new Date("2026-11-08T20:00:00.000Z"),
        )

        expect(count).toBe(3)
        expect(em.query).toHaveBeenCalledWith(INSERT_RETRIEVAL_STATE, [
            REVIEW_LEARNER,
            "retrieval:demo-lesson/r1",
            "demo-lesson",
            "r1",
            "v1",
            1,
            "2026-11-10",
            NOW,
        ])
        expect(em.query).toHaveBeenCalledWith(
            INSERT_RETRIEVAL_STATE,
            expect.arrayContaining(["retrieval:demo-lesson/r21", "2026-11-30"]),
        )
    })

    it("counts nothing for items the learner already holds", async () => {
        const { service } = await build(PLAN, [], false)

        await expect(service.enqueueLesson(REVIEW_LEARNER, "demo-lesson", "v1", NOW)).resolves.toBe(0)
    })
})

describe("ReviewScheduleService onActivityGraded", () => {
    it("schedules the retrieval items once every required activity is graded", async () => {
        const { service, em } = await build(PLAN, ["a1", "a2", "extra"])

        await expect(service.onActivityGraded(REVIEW_LEARNER, "demo-lesson", "v1")).resolves.toBe(true)

        expect(em.query).toHaveBeenCalledWith(
            INSERT_RETRIEVAL_STATE,
            expect.arrayContaining(["retrieval:demo-lesson/r7", "2026-11-15"]),
        )
    })

    it("schedules nothing while an activity is still ungraded", async () => {
        const { service, em } = await build(PLAN, ["a1"])

        await expect(service.onActivityGraded(REVIEW_LEARNER, "demo-lesson", "v1")).resolves.toBe(false)

        expect(em.query).not.toHaveBeenCalledWith(INSERT_RETRIEVAL_STATE, expect.anything())
    })

    it("does not read the attempts of a lesson that has no retrieval items", async () => {
        const { service, em } = await build({ required: ["a1"], retrieval: [] }, ["a1"])

        await expect(service.onActivityGraded(REVIEW_LEARNER, "demo-lesson", "v1")).resolves.toBe(false)

        expect(em.query).not.toHaveBeenCalled()
    })
})
