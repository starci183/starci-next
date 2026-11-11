import { FakeClock, mock, mockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { LEARNER, attemptRowOf } from "@tests/fixtures/builders/attempt.builder"
import type { QueryStub } from "@tests/fixtures/builders/attempt-stub.builder"
import { LessonContentService } from "@modules/domain/lesson"
import { ReviewScheduleService } from "@modules/domain/review"
import { CLOCK } from "@modules/platform/clock"
import { LIST_ROWS_MAX, PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { AttemptCompletionService } from "./attempt-completion.service"
import { SELECT_GRADED_ACTIVITY_IDS, UPSERT_COMPLETION } from "./persistence/attempt.sql"

const NOW = new Date("2026-11-08T10:00:00.000Z")
const FIRST = new Date("2026-11-01T08:00:00.000Z")
const REQUIRED = ["demo--predict", "demo--final"]

const stubsOf = (graded: ReadonlyArray<string>, held: Date | null): ReadonlyArray<QueryStub> => [
    [SELECT_GRADED_ACTIVITY_IDS, graded.map((activity_id) => ({ activity_id }))],
    [UPSERT_COMPLETION, held === null ? [] : [{ lesson_version: "v0", completed_at: held }]],
]

const build = async (
    queries: ReadonlyArray<QueryStub>,
    required: ReadonlyArray<string> = REQUIRED,
    withReview = true,
) => {
    const em = mockEntityManager({ query: queries })
    const content = mock<LessonContentService>()
    content.plan.mockResolvedValue({ required, retrieval: [] })
    const review = mock<ReviewScheduleService>()
    const providers = [
        AttemptCompletionService,
        { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
        { provide: CLOCK, useValue: new FakeClock(NOW) },
        { provide: LessonContentService, useValue: content },
        ...(withReview ? [{ provide: ReviewScheduleService, useValue: review }] : []),
    ]
    const moduleRef = await Test.createTestingModule({ providers }).compile()
    return { service: moduleRef.get(AttemptCompletionService), em, content, review }
}

describe("AttemptCompletionService complete", () => {
    it("opens nothing while a required activity is still ungraded", async () => {
        const { service, em, review } = await build(stubsOf(["demo--predict"], NOW))

        expect(await service.complete(attemptRowOf())).toBe(false)

        expect(em.query).not.toHaveBeenCalledWith(UPSERT_COMPLETION, expect.anything())
        expect(review.enqueueLesson).not.toHaveBeenCalled()
    })

    it("reads the graded activities of the version of the attempt, bounded", async () => {
        const { service, em, content } = await build(stubsOf([], null))

        await service.complete(attemptRowOf())

        expect(content.plan).toHaveBeenCalledWith("demo-lesson", "v1")
        expect(em.query).toHaveBeenCalledWith(SELECT_GRADED_ACTIVITY_IDS, [LEARNER, "demo-lesson", "v1", LIST_ROWS_MAX])
    })

    it("records the completion once the last required activity is graded and opens the reviews from it", async () => {
        const { service, em, review } = await build(stubsOf(REQUIRED, NOW))

        expect(await service.complete(attemptRowOf())).toBe(true)

        expect(em.query).toHaveBeenCalledWith(UPSERT_COMPLETION, [LEARNER, "demo-lesson", "v1", NOW])
        expect(review.enqueueLesson).toHaveBeenCalledWith(LEARNER, "demo-lesson", "v0", NOW)
    })

    it("opens the reviews from the first completion instant when the lesson was finished before", async () => {
        const { service, review } = await build(stubsOf(REQUIRED, FIRST))

        await service.complete(attemptRowOf())

        expect(review.enqueueLesson).toHaveBeenCalledWith(LEARNER, "demo-lesson", "v0", FIRST)
    })

    it("opens nothing when the completion row does not come back", async () => {
        const { service, review } = await build(stubsOf(REQUIRED, null))

        expect(await service.complete(attemptRowOf())).toBe(false)

        expect(review.enqueueLesson).not.toHaveBeenCalled()
    })

    it("never completes a lesson that requires nothing", async () => {
        const { service, em, review } = await build(stubsOf(REQUIRED, NOW), [])

        expect(await service.complete(attemptRowOf())).toBe(false)

        expect(em.query).not.toHaveBeenCalledWith(UPSERT_COMPLETION, expect.anything())
        expect(review.enqueueLesson).not.toHaveBeenCalled()
    })

    it("records the completion even where review is not composed", async () => {
        const { service, em } = await build(stubsOf(REQUIRED, NOW), REQUIRED, false)

        await service.complete(attemptRowOf())

        expect(em.query).toHaveBeenCalledWith(UPSERT_COMPLETION, [LEARNER, "demo-lesson", "v1", NOW])
    })
})
