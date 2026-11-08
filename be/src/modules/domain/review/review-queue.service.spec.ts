import { FakeClock, mock, mockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { catalogItemOf } from "@tests/fixtures/builders/lesson-read.builder"
import { REVIEW_LEARNER, queueRowOf } from "@tests/fixtures/builders/review.builder"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { LessonReadService } from "@modules/domain/lesson"
import { NOTIFICATION_PRODUCER, type NotificationProducerPort } from "@modules/domain/notification"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import type { QueueRow } from "./persistence/review.rows"
import { CLAIM_DUE_NOTICE, COUNT_REVIEWS_ON, SELECT_GOAL, SELECT_QUEUE } from "./persistence/review.sql"
import { ReviewQueueService } from "./review-queue.service"

const NOW = new Date("2026-11-08T03:00:00.000Z")

const retrievalOf = (overrides: Partial<QueueRow> = {}) =>
    queueRowOf({
        item_id: "retrieval:demo-lesson/demo--review",
        source: "retrieval",
        status: "learning",
        deck_id: null,
        lesson_id: "demo-lesson",
        activity_id: "demo--review",
        lesson_version: "v1",
        is_premium: null,
        level: null,
        deck_titles: null,
        ...overrides,
    })

const build = async (
    rows: ReadonlyArray<QueueRow>,
    options: { premium?: boolean; goal?: number | null; done?: number } = {},
) => {
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(options.premium ?? false)
    const lessons = mock<LessonReadService>()
    lessons.catalog.mockResolvedValue([catalogItemOf("demo-lesson", "Demo lesson")])
    const goal = options.goal === null ? [] : [{ daily_goal: options.goal ?? 10 }]
    const em = mockEntityManager({
        query: [
            [SELECT_QUEUE, rows],
            [SELECT_GOAL, goal],
            [COUNT_REVIEWS_ON, [{ total: options.done ?? 0 }]],
            [CLAIM_DUE_NOTICE, []],
        ],
    })
    const producer = mock<NotificationProducerPort>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            ReviewQueueService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            { provide: LessonReadService, useValue: lessons },
            { provide: NOTIFICATION_PRODUCER, useValue: producer },
        ],
    }).compile()
    return { service: moduleRef.get(ReviewQueueService), em, lessons, notify: producer.notify }
}

const dueRow = (n: number, due = "2026-11-08", overrides: Partial<QueueRow> = {}) =>
    queueRowOf({ item_id: `card:d/${n}`, status: "learning", step: 1, due_on: due, ...overrides })

const freshRow = (n: number, overrides: Partial<QueueRow> = {}) => queueRowOf({ item_id: `card:d/${n}`, ...overrides })

describe("ReviewQueueService today", () => {
    it("lists the due items oldest first, then new items up to the goal, and counts the overdue ones", async () => {
        const rows = [
            dueRow(1, "2026-11-06"),
            dueRow(2),
            dueRow(3, "2026-11-09"),
            freshRow(4),
            freshRow(5),
            freshRow(6),
        ]
        const { service, em } = await build(rows, { goal: 5, done: 1 })

        const today = await service.today(REVIEW_LEARNER, "vi")

        expect(today).toMatchObject({
            date: "2026-11-08",
            due: 2,
            overdue: 1,
            newAvailable: 2,
            lockedCount: 0,
            goal: { daily: 5, done: 1 },
        })
        expect(today.items.map((item) => item.itemId)).toEqual(["card:d/1", "card:d/2", "card:d/4", "card:d/5"])
        expect(today.items[0]).toMatchObject({
            deckTitle: "vi Module 1",
            level: "junior",
            locked: false,
            source: "flashcard",
        })
        expect(em.query).toHaveBeenCalledWith(SELECT_QUEUE, [REVIEW_LEARNER, 2000])
    })

    it("marks the premium items locked for a free learner and leaves them out of the counts and the new items", async () => {
        const rows = [
            dueRow(1),
            dueRow(2, "2026-11-08", { is_premium: true }),
            retrievalOf({ due_on: "2026-11-08" }),
            freshRow(3, { is_premium: true }),
            freshRow(4),
        ]
        const { service } = await build(rows)

        const today = await service.today(REVIEW_LEARNER, "en")

        expect(today).toMatchObject({ due: 1, newAvailable: 1, lockedCount: 3 })
        expect(today.items.map((item) => [item.itemId, item.locked])).toEqual([
            ["card:d/1", false],
            ["card:d/4", false],
            ["card:d/2", true],
            ["retrieval:demo-lesson/demo--review", true],
        ])
    })

    it("serves the retrieval items to a Premium learner with the lesson title, and falls back to the lesson id", async () => {
        const rows = [retrievalOf(), retrievalOf({ item_id: "retrieval:other/x", lesson_id: "other" })]
        const { service } = await build(rows, { premium: true, goal: null })

        const today = await service.today(REVIEW_LEARNER, "vi")

        expect(today.goal.daily).toBe(10)
        expect(today.items.map((item) => [item.lessonTitle, item.deckTitle, item.level, item.locked])).toEqual([
            ["Demo lesson", null, null, false],
            ["other", null, null, false],
        ])
    })
})

describe("ReviewQueueService summary and notice", () => {
    it("reads a day with no review row as nothing done", async () => {
        const { service, em } = await build([dueRow(1)])
        em.query.mockImplementation((query: string) =>
            query === SELECT_QUEUE ? Promise.resolve([dueRow(1)]) : Promise.resolve([]),
        )

        await expect(service.summary(REVIEW_LEARNER, "vi")).resolves.toMatchObject({ doneToday: 0, goalDaily: 10 })
    })

    it("offers no new item once the goal is met", async () => {
        const { service } = await build([dueRow(1), freshRow(2)], { goal: 5, done: 5 })

        await expect(service.today(REVIEW_LEARNER, "vi")).resolves.toMatchObject({ due: 1, newAvailable: 0 })
    })
})

describe("ReviewQueueService summary", () => {
    it("counts the day for the hub without reading the lesson titles", async () => {
        const { service, lessons } = await build([dueRow(1, "2026-11-01"), freshRow(2)], { goal: 8, done: 3 })

        await expect(service.summary(REVIEW_LEARNER, "vi")).resolves.toEqual({
            date: "2026-11-08",
            due: 1,
            overdue: 1,
            newAvailable: 1,
            goalDaily: 8,
            doneToday: 3,
        })
        expect(lessons.catalog).not.toHaveBeenCalled()
    })
})

describe("ReviewQueueService due notice", () => {
    it("tells the learner once a day how many cards are due, with a link to /review", async () => {
        const { service, em, notify } = await build([dueRow(1), dueRow(2)], { premium: true })
        em.query.mockImplementation((query: string) => {
            if (query === SELECT_QUEUE) return Promise.resolve([dueRow(1), dueRow(2)])
            return Promise.resolve(query === CLAIM_DUE_NOTICE ? [{ learner_id: REVIEW_LEARNER }] : [])
        })

        await service.summary(REVIEW_LEARNER, "vi")

        expect(notify).toHaveBeenCalledWith(REVIEW_LEARNER, "review.due", { count: 2 }, "/review")
    })

    it("says nothing a second time the same day, and nothing when no card is due", async () => {
        const { service, notify } = await build([dueRow(1)], { premium: true })
        await service.summary(REVIEW_LEARNER, "vi")
        const quiet = await build([freshRow(1)])
        await quiet.service.summary(REVIEW_LEARNER, "vi")

        expect(notify).not.toHaveBeenCalled()
        expect(quiet.notify).not.toHaveBeenCalled()
    })
})
