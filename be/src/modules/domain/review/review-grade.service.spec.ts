import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { REVIEW_LEARNER, cardRowOf, stateRowOf } from "@tests/fixtures/builders/review.builder"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { StreakService } from "@modules/domain/streak"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { ReviewErrorCode } from "./errors/review.error"
import type { CardRow, StateRow } from "./persistence/review.rows"
import {
    COUNT_REMAINING_DUE,
    COUNT_REVIEWS_ON,
    INSERT_REVIEW,
    SELECT_CARD,
    SELECT_GOAL,
    SELECT_REVIEW,
    SELECT_STATE,
    SELECT_STATE_LOCKED,
    UPDATE_STATE,
} from "./persistence/review.sql"
import { ReviewGradeService } from "./review-grade.service"
import { REVIEW_SCHEDULER } from "./review-scheduler.port"
import { ladderScheduler, type ReviewScheduler } from "./review-scheduler.policy"
import { ReviewLogEvent } from "./review.log-events"

const NOW = new Date("2026-11-08T03:00:00.000Z")
const CARD_ID = "card:0-fullstack-mastery/0-module-1/0"

interface Options {
    /** The state the learner holds; null for none. */
    readonly state?: StateRow | null
    /** The state the transaction locks; defaults to the state. */
    readonly locked?: StateRow | null
    readonly card?: CardRow | null
    readonly premium?: boolean
    readonly stored?: string | null
    readonly remaining?: number
}

const build = async (options: Options = {}) => {
    const state = options.state === undefined ? stateRowOf({ flipped_revision: 1 }) : options.state
    const locked = options.locked === undefined ? state : options.locked
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(options.premium ?? true)
    const streak = mock<StreakService>()
    streak.recordStreakAction.mockResolvedValue({ counted: true, day: "2026-11-08" })
    const logger = mock<Logger>()
    const scheduler = mock<ReviewScheduler>()
    scheduler.schedule.mockImplementation((from, grade) => ladderScheduler.schedule(from, grade))
    scheduler.scheduleRetrieval.mockImplementation((grade) => ladderScheduler.scheduleRetrieval(grade))
    const em = mockEntityManager({
        query: [
            [SELECT_STATE, state === null ? [] : [state]],
            [SELECT_CARD, options.card === undefined || options.card === null ? [cardRowOf()] : [options.card]],
            [SELECT_STATE_LOCKED, locked === null ? [] : [locked]],
            [SELECT_REVIEW, options.stored === undefined || options.stored === null ? [] : [{ grade: options.stored }]],
            [INSERT_REVIEW, []],
            [UPDATE_STATE, []],
            [SELECT_GOAL, [{ daily_goal: 10 }]],
            [COUNT_REVIEWS_ON, [{ total: 3 }]],
            [COUNT_REMAINING_DUE, [{ total: options.remaining ?? 2 }]],
        ],
    })
    const tx = fakeTransaction(em)
    const moduleRef = await Test.createTestingModule({
        providers: [
            ReviewGradeService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            { provide: REVIEW_SCHEDULER, useValue: scheduler },
            { provide: LOGGER, useValue: logger },
            { provide: StreakService, useValue: streak },
        ],
    }).compile()
    return { service: moduleRef.get(ReviewGradeService), em, tx, streak, logger }
}

const params = (overrides: Record<string, unknown> = {}) => ({
    learnerId: REVIEW_LEARNER,
    itemId: CARD_ID,
    revision: 1,
    grade: "good",
    clozeCorrect: true,
    ...overrides,
})

describe("ReviewGradeService grade", () => {
    it("stores the review and moves the card one step up the ladder in one transaction", async () => {
        const { service, em, tx, streak } = await build({
            state: stateRowOf({ step: 1, flipped_revision: 1, last_revision: 0 }),
        })

        const view = await service.grade(params())

        expect(em.query).toHaveBeenCalledWith(INSERT_REVIEW, [
            REVIEW_LEARNER,
            CARD_ID,
            1,
            "good",
            true,
            NOW,
            "2026-11-08",
        ])
        expect(em.query).toHaveBeenCalledWith(UPDATE_STATE, [
            REVIEW_LEARNER,
            CARD_ID,
            "review",
            2,
            "2026-11-15",
            1,
            NOW,
        ])
        expect(tx.commits).toBe(1)
        expect(view).toMatchObject({ itemId: CARD_ID, goal: { daily: 10, done: 3 }, remainingToday: 2 })
        expect(streak.recordStreakAction).not.toHaveBeenCalled()
    })

    it("returns a forgotten card at the end of the session of today", async () => {
        const { service, em } = await build({ state: stateRowOf({ step: 4, flipped_revision: 1 }) })

        await service.grade(params({ grade: "again", clozeCorrect: null }))

        expect(em.query).toHaveBeenCalledWith(UPDATE_STATE, [
            REVIEW_LEARNER,
            CARD_ID,
            "learning",
            0,
            "2026-11-08",
            1,
            NOW,
        ])
    })
})

describe("ReviewGradeService grade retrieval items", () => {
    it("closes a retrieval item graded easy and asks once more after three days when the grade was weak", async () => {
        const state = stateRowOf({
            item_id: "retrieval:demo-lesson/demo--review",
            source: "retrieval",
            status: "learning",
            step: 0,
            flipped_revision: 1,
            lesson_id: "demo-lesson",
            deck_id: null,
        })
        const closed = await build({ state })
        const retry = await build({ state })

        await closed.service.grade(params({ itemId: state.item_id, grade: "easy" }))
        await retry.service.grade(params({ itemId: state.item_id, grade: "hard" }))

        expect(closed.em.query).toHaveBeenCalledWith(UPDATE_STATE, [
            REVIEW_LEARNER,
            state.item_id,
            "done",
            0,
            "2026-11-08",
            1,
            NOW,
        ])
        expect(retry.em.query).toHaveBeenCalledWith(UPDATE_STATE, [
            REVIEW_LEARNER,
            state.item_id,
            "learning",
            0,
            "2026-11-11",
            1,
            NOW,
        ])
    })

    it("reports the day to the streak, under the day as its action id, when the last item due is graded", async () => {
        const { service, streak } = await build({ remaining: 0 })

        await service.grade(params())

        expect(streak.recordStreakAction).toHaveBeenCalledWith(REVIEW_LEARNER, "review", "review-due-done", {
            actionId: "review-due-done:2026-11-08",
            sourceRef: "review:2026-11-08",
        })
    })
})

describe("ReviewGradeService grade streak report", () => {
    it("still answers the grade when the streak report fails, and logs it", async () => {
        const { service, streak, logger } = await build({ remaining: 0 })
        streak.recordStreakAction.mockRejectedValue(new Error("down"))

        await expect(service.grade(params())).resolves.toMatchObject({ remainingToday: 0 })

        expect(logger.error).toHaveBeenCalledWith(ReviewLogEvent.StreakReportFailed, expect.any(Error), {
            day: "2026-11-08",
        })
    })

    it("stores nothing twice: the same grade under a stored revision answers the item as it stands", async () => {
        const { service, em } = await build({ stored: "good" })

        await service.grade(params())

        expect(em.query).not.toHaveBeenCalledWith(INSERT_REVIEW, expect.anything())
        expect(em.query).not.toHaveBeenCalledWith(UPDATE_STATE, expect.anything())
    })

    it("refuses another grade under a stored revision and a revision that is not the next one", async () => {
        const stored = await build({ stored: "good" })
        const skipped = await build({ state: stateRowOf({ last_revision: 3, flipped_revision: 4 }) })

        await expect(stored.service.grade(params({ grade: "easy" }))).rejects.toMatchObject({
            code: ReviewErrorCode.RevisionConflict,
        })
        await expect(skipped.service.grade(params({ revision: 2 }))).rejects.toMatchObject({
            code: ReviewErrorCode.RevisionConflict,
        })
        expect(stored.tx.rollbacks).toBe(1)
    })
})

describe("ReviewGradeService grade refusals", () => {
    it("refuses a grade before the card was flipped, and stores nothing", async () => {
        const { service, em } = await build({ state: stateRowOf({ flipped_revision: 0 }) })

        await expect(service.grade(params())).rejects.toMatchObject({ code: ReviewErrorCode.NotFlipped })
        expect(em.query).not.toHaveBeenCalledWith(INSERT_REVIEW, expect.anything())
    })

    it("refuses a grade that is not one of the four", async () => {
        const { service } = await build()

        await expect(service.grade(params({ grade: "perfect" }))).rejects.toMatchObject({
            code: ReviewErrorCode.GradeInvalid,
        })
    })

    it("refuses an item the learner does not hold, in the check or under the lock, and a card no longer published", async () => {
        const missing = await build({ state: null })
        const vanished = await build({ locked: null })
        const unpublished = await build({ state: stateRowOf() })
        unpublished.em.query.mockImplementation((query: string) =>
            query === SELECT_CARD ? Promise.resolve([]) : Promise.resolve([stateRowOf()]),
        )

        await expect(missing.service.grade(params())).rejects.toMatchObject({ code: ReviewErrorCode.ItemNotFound })
        await expect(vanished.service.grade(params())).rejects.toMatchObject({ code: ReviewErrorCode.ItemNotFound })
        await expect(unpublished.service.grade(params())).rejects.toMatchObject({ code: ReviewErrorCode.ItemNotFound })
    })
})

describe("ReviewGradeService grade access", () => {
    it("refuses a premium card and a retrieval item to a learner without Premium", async () => {
        const premiumCard = await build({ premium: false, card: cardRowOf({ is_premium: true }) })
        const retrieval = await build({
            premium: false,
            state: stateRowOf({ item_id: "retrieval:a/b", source: "retrieval" }),
        })

        await expect(premiumCard.service.grade(params())).rejects.toMatchObject({
            code: ReviewErrorCode.PremiumRequired,
        })
        await expect(retrieval.service.grade(params({ itemId: "retrieval:a/b" }))).rejects.toMatchObject({
            code: ReviewErrorCode.PremiumRequired,
        })
    })

    it("lets a free learner grade a free card", async () => {
        const { service } = await build({ premium: false })

        await expect(service.grade(params())).resolves.toMatchObject({ itemId: CARD_ID })
    })

    it("reads a day with no goal row and no review as the default goal and nothing done", async () => {
        const { service, em } = await build()
        em.query.mockImplementation((query: string) => {
            if (query === SELECT_GOAL || query === COUNT_REVIEWS_ON || query === COUNT_REMAINING_DUE)
                return Promise.resolve([])
            if (query === SELECT_REVIEW) return Promise.resolve([{ grade: "good" }])
            if (query === SELECT_CARD) return Promise.resolve([cardRowOf()])
            return Promise.resolve([stateRowOf({ flipped_revision: 1 })])
        })
        const view = await service.grade(params())

        expect(view).toMatchObject({ goal: { daily: 10, done: 0 }, remainingToday: 0 })
    })

    it("answers item not found when the state vanished before the view was read", async () => {
        const { service, em } = await build()
        let reads = 0
        em.query.mockImplementation((query: string) => {
            if (query === SELECT_STATE) return Promise.resolve(++reads === 1 ? [stateRowOf()] : [])
            if (query === SELECT_CARD) return Promise.resolve([cardRowOf()])
            if (query === SELECT_STATE_LOCKED) return Promise.resolve([stateRowOf({ flipped_revision: 1 })])
            if (query === SELECT_REVIEW) return Promise.resolve([])
            if (query === SELECT_GOAL) return Promise.resolve([])
            if (query === COUNT_REVIEWS_ON) return Promise.resolve([])
            if (query === COUNT_REMAINING_DUE) return Promise.resolve([])
            return Promise.resolve([])
        })

        await expect(service.grade(params())).rejects.toMatchObject({ code: ReviewErrorCode.ItemNotFound })
    })
})
