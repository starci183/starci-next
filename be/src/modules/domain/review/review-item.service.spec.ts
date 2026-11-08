import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { catalogItemOf } from "@tests/fixtures/builders/lesson-read.builder"
import { REVIEW_LEARNER, cardRowOf, stateRowOf } from "@tests/fixtures/builders/review.builder"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { LessonContentService, LessonReadService } from "@modules/domain/lesson"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { ReviewErrorCode } from "./errors/review.error"
import type { CardRow, StateRow } from "./persistence/review.rows"
import { INSERT_ANSWER, MARK_FLIPPED, SELECT_CARD, SELECT_STATE } from "./persistence/review.sql"
import { ReviewItemService } from "./review-item.service"
import { REVIEW_SCHEDULER } from "./review-scheduler.port"
import { ladderScheduler, type ReviewScheduler } from "./review-scheduler.policy"

const NOW = new Date("2026-11-08T03:00:00.000Z")
const CARD_ID = "card:0-fullstack-mastery/0-module-1/0"
const RETRIEVAL_ID = "retrieval:demo-lesson/demo--review"

const retrievalState = (overrides: Partial<StateRow> = {}) =>
    stateRowOf({
        item_id: RETRIEVAL_ID,
        source: "retrieval",
        status: "learning",
        deck_id: null,
        lesson_id: "demo-lesson",
        activity_id: "demo--review",
        lesson_version: "v1",
        ...overrides,
    })

const build = async (state: StateRow | null, card: CardRow | null, premium = true) => {
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(premium)
    const content = mock<LessonContentService>()
    content.activity.mockResolvedValue({
        activity: {
            id: "demo--review",
            kind: "retrieval",
            prompt: "A day later: what stays stale?",
            outcomeIds: [],
            answer: { explanation: "Because.", sampleAnswer: "The cache." },
        },
        phase: "retrieval",
    })
    const scheduler = mock<ReviewScheduler>()
    scheduler.preview.mockImplementation((from) => ladderScheduler.preview(from))
    scheduler.scheduleRetrieval.mockImplementation((grade) => ladderScheduler.scheduleRetrieval(grade))
    const lessons = mock<LessonReadService>()
    lessons.catalog.mockResolvedValue([catalogItemOf("demo-lesson", "Demo lesson")])
    const queries: Array<readonly [string, unknown]> = [
        [SELECT_STATE, state === null ? [] : [state]],
        [SELECT_CARD, card === null ? [] : [card]],
        [MARK_FLIPPED, [{ item_id: "x" }]],
        [INSERT_ANSWER, []],
    ]
    const tx = fakeTransaction(mockEntityManager({ query: queries }))
    const moduleRef = await Test.createTestingModule({
        providers: [
            ReviewItemService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            { provide: REVIEW_SCHEDULER, useValue: scheduler },
            { provide: LessonContentService, useValue: content },
            { provide: LessonReadService, useValue: lessons },
        ],
    }).compile()
    return { service: moduleRef.get(ReviewItemService), em: tx.em, entitlement, content, lessons }
}

describe("ReviewItemService item", () => {
    it("serves the question of a card with shuffled cloze choices, and nothing of the answer or the term position", async () => {
        const { service } = await build(
            stateRowOf({ last_revision: 2, flipped_revision: 3 }),
            cardRowOf({ langs: "go" }),
        )

        const item = await service.item(REVIEW_LEARNER, CARD_ID, "en")

        expect(item).toMatchObject({
            itemId: CARD_ID,
            source: "flashcard",
            question: "en Why?",
            level: "junior",
            tags: ["DI"],
            langs: ["go"],
            deckTitle: "en Module 1",
            revision: 3,
            flipped: true,
        })
        expect([...(item.cloze[0]?.choices ?? [])].sort()).toEqual(["container", "factory", "locator"])
        expect(JSON.stringify(item)).not.toContain("wins")
    })

    it("serves a card without a language as one with none, and not flipped before the flip", async () => {
        const { service } = await build(stateRowOf(), cardRowOf())

        await expect(service.item(REVIEW_LEARNER, CARD_ID, "vi")).resolves.toMatchObject({ langs: [], flipped: false })
    })

    it("serves the prompt of a retrieval item with its lesson title to a Premium learner and not the sample answer", async () => {
        const { service } = await build(retrievalState(), null)

        const item = await service.item(REVIEW_LEARNER, RETRIEVAL_ID, "vi")

        expect(item).toMatchObject({
            source: "retrieval",
            question: "A day later: what stays stale?",
            lessonId: "demo-lesson",
            activityId: "demo--review",
            lessonTitle: "Demo lesson",
            level: null,
            cloze: [],
        })
        expect(JSON.stringify(item)).not.toContain("The cache.")
    })

    it("falls back to the lesson id when the lesson is not in the catalog", async () => {
        const { service, lessons } = await build(retrievalState({ lesson_id: "gone" }), null)
        lessons.catalog.mockResolvedValue([])

        await expect(service.item(REVIEW_LEARNER, RETRIEVAL_ID, "vi")).resolves.toMatchObject({ lessonTitle: "gone" })
    })
})

describe("ReviewItemService item refusals", () => {
    it("does not open a retrieval state that lost its lesson reference", async () => {
        const { service, content } = await build(retrievalState({ lesson_version: null }), null)
        const detached = await build(retrievalState({ activity_id: null }), null)

        await expect(service.item(REVIEW_LEARNER, RETRIEVAL_ID, "vi")).rejects.toMatchObject({
            code: ReviewErrorCode.ItemNotFound,
        })
        await expect(
            detached.service.submitRetrieval(REVIEW_LEARNER, RETRIEVAL_ID, 1, "x", "vi"),
        ).rejects.toMatchObject({
            code: ReviewErrorCode.ItemNotFound,
        })
        expect(content.activity).not.toHaveBeenCalled()
    })

    it("refuses an item the learner does not hold and a card that is no longer published", async () => {
        const missing = await build(null, null)
        const unpublished = await build(stateRowOf(), null)

        await expect(missing.service.item(REVIEW_LEARNER, CARD_ID, "vi")).rejects.toMatchObject({
            code: ReviewErrorCode.ItemNotFound,
        })
        await expect(unpublished.service.item(REVIEW_LEARNER, CARD_ID, "vi")).rejects.toMatchObject({
            code: ReviewErrorCode.ItemNotFound,
        })
    })

    it("refuses a premium card and a retrieval item to a learner without Premium, and a free card passes", async () => {
        const premiumCard = await build(stateRowOf(), cardRowOf({ is_premium: true }), false)
        const retrieval = await build(retrievalState(), null, false)
        const free = await build(stateRowOf(), cardRowOf(), false)

        await expect(premiumCard.service.item(REVIEW_LEARNER, CARD_ID, "vi")).rejects.toMatchObject({
            code: ReviewErrorCode.PremiumRequired,
        })
        await expect(retrieval.service.item(REVIEW_LEARNER, RETRIEVAL_ID, "vi")).rejects.toMatchObject({
            code: ReviewErrorCode.PremiumRequired,
        })
        await expect(free.service.item(REVIEW_LEARNER, CARD_ID, "vi")).resolves.toMatchObject({ itemId: CARD_ID })
        expect(retrieval.content.activity).not.toHaveBeenCalled()
    })
})

describe("ReviewItemService checkCloze", () => {
    it("answers correct only for the hidden term and releases nothing else", async () => {
        const { service } = await build(stateRowOf(), cardRowOf())

        await expect(service.checkCloze(REVIEW_LEARNER, CARD_ID, 1, "container", "vi")).resolves.toEqual({
            correct: true,
        })
        await expect(service.checkCloze(REVIEW_LEARNER, CARD_ID, 1, "factory", "vi")).resolves.toEqual({
            correct: false,
        })
    })

    it("refuses a cloze the card does not have and an item that is not a card", async () => {
        const card = await build(stateRowOf(), cardRowOf())
        const retrieval = await build(retrievalState(), null)

        await expect(card.service.checkCloze(REVIEW_LEARNER, CARD_ID, 9, "x", "vi")).rejects.toMatchObject({
            code: ReviewErrorCode.AnswerInvalid,
        })
        await expect(retrieval.service.checkCloze(REVIEW_LEARNER, RETRIEVAL_ID, 1, "x", "vi")).rejects.toMatchObject({
            code: ReviewErrorCode.AnswerInvalid,
        })
    })
})

describe("ReviewItemService flip", () => {
    it("reveals the answer with the terms in bold, marks the next revision flipped and previews the four grades", async () => {
        const { service, em } = await build(stateRowOf({ step: 1, last_revision: 4 }), cardRowOf())

        const flipped = await service.flip(REVIEW_LEARNER, CARD_ID, "en")

        expect(flipped).toEqual({
            itemId: CARD_ID,
            revision: 5,
            answer: "en A **container** wins.",
            intervals: { again: 0, hard: 3, good: 7, easy: 14 },
        })
        expect(em.query).toHaveBeenCalledWith(MARK_FLIPPED, [REVIEW_LEARNER, CARD_ID, 5])
    })

    it("refuses to flip a retrieval item, which is answered in writing", async () => {
        const { service } = await build(retrievalState(), null)

        await expect(service.flip(REVIEW_LEARNER, RETRIEVAL_ID, "vi")).rejects.toMatchObject({
            code: ReviewErrorCode.AnswerInvalid,
        })
    })
})

describe("ReviewItemService submitRetrieval", () => {
    it("stores the answer, marks the revision flipped and only then shows the sample answer", async () => {
        const { service, em } = await build(retrievalState({ last_revision: 1 }), null)

        const shown = await service.submitRetrieval(REVIEW_LEARNER, RETRIEVAL_ID, 2, "  My own words  ", "vi")

        expect(shown).toEqual({
            itemId: RETRIEVAL_ID,
            revision: 2,
            answer: "The cache.",
            intervals: { again: 3, hard: 3, good: 0, easy: 0 },
        })
        expect(em.query).toHaveBeenCalledWith(INSERT_ANSWER, [REVIEW_LEARNER, RETRIEVAL_ID, 2, "My own words", NOW])
        expect(em.query).toHaveBeenCalledWith(MARK_FLIPPED, [REVIEW_LEARNER, RETRIEVAL_ID, 2])
    })

    it("falls back to the explanation, then to nothing, when the lesson has no sample answer", async () => {
        const { service, content } = await build(retrievalState(), null)
        content.activity.mockResolvedValueOnce({
            activity: { id: "a", kind: "retrieval", prompt: "p", outcomeIds: [], answer: { explanation: "Because." } },
            phase: "retrieval",
        })
        content.activity.mockResolvedValueOnce({
            activity: { id: "a", kind: "retrieval", prompt: "p", outcomeIds: [] },
            phase: "retrieval",
        })

        await expect(service.submitRetrieval(REVIEW_LEARNER, RETRIEVAL_ID, 1, "x", "vi")).resolves.toMatchObject({
            answer: "Because.",
        })
        await expect(service.submitRetrieval(REVIEW_LEARNER, RETRIEVAL_ID, 1, "x", "vi")).resolves.toMatchObject({
            answer: "",
        })
    })

    it("refuses an empty or too long answer, a card, and a revision that is not the next one", async () => {
        const retrieval = await build(retrievalState({ last_revision: 1 }), null)
        const card = await build(stateRowOf(), cardRowOf())

        await expect(
            retrieval.service.submitRetrieval(REVIEW_LEARNER, RETRIEVAL_ID, 2, "   ", "vi"),
        ).rejects.toMatchObject({
            code: ReviewErrorCode.AnswerInvalid,
        })
        await expect(
            retrieval.service.submitRetrieval(REVIEW_LEARNER, RETRIEVAL_ID, 2, "x".repeat(4001), "vi"),
        ).rejects.toMatchObject({ code: ReviewErrorCode.AnswerInvalid })
        await expect(card.service.submitRetrieval(REVIEW_LEARNER, CARD_ID, 1, "x", "vi")).rejects.toMatchObject({
            code: ReviewErrorCode.AnswerInvalid,
        })
        await expect(
            retrieval.service.submitRetrieval(REVIEW_LEARNER, RETRIEVAL_ID, 5, "x", "vi"),
        ).rejects.toMatchObject({
            code: ReviewErrorCode.RevisionConflict,
        })
        expect(retrieval.content.activity).not.toHaveBeenCalled()
    })
})
