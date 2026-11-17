import { FakeClock, fakeTransaction, mockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { REVIEW_LEARNER } from "@tests/fixtures/builders/review.builder"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { ReviewErrorCode } from "./errors/review.error"
import {
    COUNT_ACTIVE_DAYS,
    INSERT_DECK_STATES,
    RESTORE_DECK_STATES,
    SELECT_DECK,
    SELECT_DECKS,
    SELECT_DECK_EXISTS,
    SELECT_DECK_PROGRESS,
    SELECT_GOAL,
    SELECT_RECALL,
    SELECT_SAMPLE_CARDS,
    SUSPEND_DECK_STATES,
    UPSERT_GOAL,
    UPSERT_LEARNER_DECK,
} from "./persistence/review.sql"
import { ReviewDeckService } from "./review-deck.service"

const NOW = new Date("2026-11-08T03:00:00.000Z")
const DECK = "0-fullstack-mastery/0-module-1"

const deckRow = {
    deck_id: DECK,
    course: "0-fullstack-mastery",
    titles: { vi: "vi Module 1", en: "en Module 1" },
    descriptions: { vi: "vi description", en: "en description" },
    difficulty: "hard",
    card_count: 20,
    tracks: ["backend-fullstack"],
    added: true,
}

const build = async (exists = 1) => {
    const em = mockEntityManager({
        query: [
            [SELECT_DECKS, [deckRow]],
            [SELECT_DECK_EXISTS, [{ total: exists }]],
            [UPSERT_LEARNER_DECK, []],
            [RESTORE_DECK_STATES, []],
            [INSERT_DECK_STATES, [{ item_id: "a" }, { item_id: "b" }]],
            [SUSPEND_DECK_STATES, [{ item_id: "a" }]],
            [UPSERT_GOAL, []],
            [COUNT_ACTIVE_DAYS, [{ total: 6 }]],
            [
                SELECT_RECALL,
                [
                    { n: 1, total: 4, recalled: 3 },
                    { n: 2, total: 0, recalled: 0 },
                ],
            ],
        ],
    })
    const tx = fakeTransaction(em)
    const moduleRef = await Test.createTestingModule({
        providers: [
            ReviewDeckService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
        ],
    }).compile()
    return { service: moduleRef.get(ReviewDeckService), em, tx }
}

describe("ReviewDeckService decks", () => {
    it("lists the decks titled in the locale, with whether the learner added each", async () => {
        const { service, em } = await build()

        const decks = await service.decks(REVIEW_LEARNER, { locale: "en", track: "backend-fullstack" })

        expect(decks).toEqual([
            {
                deckId: DECK,
                course: "0-fullstack-mastery",
                title: "en Module 1",
                description: "en description",
                difficulty: "hard",
                cardCount: 20,
                added: true,
                track: ["backend-fullstack"],
            },
        ])
        expect(em.query).toHaveBeenCalledWith(SELECT_DECKS, [REVIEW_LEARNER, "backend-fullstack", 200])
    })
})

describe("ReviewDeckService decks of every track", () => {
    it("asks for no track when none is given", async () => {
        const { service, em } = await build()

        await service.decks(REVIEW_LEARNER, { locale: "vi" })

        expect(em.query).toHaveBeenCalledWith(SELECT_DECKS, [REVIEW_LEARNER, null, 200])
    })
})

describe("ReviewDeckService add and remove", () => {
    it("gives the learner the cards of a deck due today, bringing back suspended ones first", async () => {
        const { service, em, tx } = await build()

        await expect(service.add(REVIEW_LEARNER, DECK)).resolves.toEqual({ deckId: DECK, added: true, newCards: 2 })

        expect(em.query).toHaveBeenCalledWith(UPSERT_LEARNER_DECK, [REVIEW_LEARNER, DECK, true, NOW])
        expect(em.query).toHaveBeenCalledWith(RESTORE_DECK_STATES, [REVIEW_LEARNER, DECK, NOW])
        expect(em.query).toHaveBeenCalledWith(INSERT_DECK_STATES, [REVIEW_LEARNER, DECK, "2026-11-08", NOW])
        expect(tx.commits).toBe(1)
    })

    it("suspends the items of a removed deck and counts them", async () => {
        const { service, em } = await build()

        await expect(service.remove(REVIEW_LEARNER, DECK)).resolves.toEqual({
            deckId: DECK,
            added: false,
            suspended: 1,
        })

        expect(em.query).toHaveBeenCalledWith(UPSERT_LEARNER_DECK, [REVIEW_LEARNER, DECK, false, NOW])
    })

    it("refuses a deck that does not exist", async () => {
        const { service } = await build(0)

        await expect(service.add(REVIEW_LEARNER, "x/y")).rejects.toMatchObject({ code: ReviewErrorCode.DeckNotFound })
        await expect(service.remove(REVIEW_LEARNER, "x/y")).rejects.toMatchObject({
            code: ReviewErrorCode.DeckNotFound,
        })
    })

    it("treats a missing count row as no deck", async () => {
        const { service, em } = await build()
        em.query.mockImplementation((query: string) =>
            query === SELECT_DECK_EXISTS ? Promise.resolve([]) : Promise.resolve([]),
        )

        await expect(service.add(REVIEW_LEARNER, DECK)).rejects.toMatchObject({ code: ReviewErrorCode.DeckNotFound })
    })
})

describe("ReviewDeckService setGoal", () => {
    it("stores a goal from 5 to 50", async () => {
        const { service, em } = await build()

        await expect(service.setGoal(REVIEW_LEARNER, 25)).resolves.toEqual({ daily: 25 })

        expect(em.query).toHaveBeenCalledWith(UPSERT_GOAL, [REVIEW_LEARNER, 25, NOW])
    })

    it.each([4, 51, 10.5, Number.NaN])("refuses the goal %s", async (daily) => {
        const { service, em } = await build()

        await expect(service.setGoal(REVIEW_LEARNER, daily)).rejects.toMatchObject({
            code: ReviewErrorCode.GoalInvalid,
        })
        expect(em.query).not.toHaveBeenCalled()
    })
})

describe("ReviewDeckService stats", () => {
    it("measures the active days a week over 28 days and the recall rate of the first reviews", async () => {
        const { service, em } = await build()

        await expect(service.stats(REVIEW_LEARNER, { days: null })).resolves.toEqual({
            activeDaysPerWeek: 1.5,
            recallRateByReview: [
                { n: 1, rate: 0.75 },
                { n: 2, rate: 0 },
            ],
        })
        expect(em.query).toHaveBeenCalledWith(COUNT_ACTIVE_DAYS, [REVIEW_LEARNER, "2026-10-12"])
    })

    it("looks back as many days as asked", async () => {
        const { service, em } = await build()

        await service.stats(REVIEW_LEARNER, { days: 7 })

        expect(em.query).toHaveBeenCalledWith(COUNT_ACTIVE_DAYS, [REVIEW_LEARNER, "2026-11-02"])
    })

    it("reads a missing count as no active day", async () => {
        const { service, em } = await build()
        em.query.mockResolvedValue([])

        await expect(service.stats(REVIEW_LEARNER, { days: 7 })).resolves.toEqual({
            activeDaysPerWeek: 0,
            recallRateByReview: [],
        })
    })
})

const front = (question: string) => ({
    vi: { question: `vi ${question}`, tags: [] },
    en: { question, tags: ["secret-tag"] },
})
const back = (clozes: ReadonlyArray<{ n: number; term: string; distractors: ReadonlyArray<string> }>) => ({
    vi: { answer: "vi SECRET-ANSWER", clozes },
    en: { answer: "en SECRET-ANSWER", clozes },
})
const cards = [
    { item_id: "card:d/0", front: front("What is DI?"), back: back([]) },
    {
        item_id: "card:d/1",
        front: front("A {{c1::container}} builds the graph"),
        back: back([{ n: 1, term: "container", distractors: ["factory"] }]),
    },
    { item_id: "card:d/2", front: front("Why?"), back: back([{ n: 1, term: "x", distractors: ["y"] }]) },
]

const buildDetail = async (options: { added?: boolean; goal?: number | null; deck?: boolean } = {}) => {
    const em = mockEntityManager({
        query: [
            [SELECT_DECK, options.deck === false ? [] : [{ ...deckRow, added: options.added ?? true }]],
            [SELECT_SAMPLE_CARDS, cards],
            [SELECT_DECK_PROGRESS, [{ total: 20, learned: 8, remembering: 5 }]],
            [SELECT_GOAL, options.goal === null ? [] : [{ daily_goal: options.goal ?? 10 }]],
        ],
    })
    const moduleRef = await Test.createTestingModule({
        providers: [
            ReviewDeckService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
        ],
    }).compile()
    return { service: moduleRef.get(ReviewDeckService), em }
}

describe("ReviewDeckService deck", () => {
    it("answers the deck, three sample questions with the kind of each and never an answer, and the progress of the viewer", async () => {
        const { service, em } = await buildDetail()

        const detail = await service.deck(REVIEW_LEARNER, { deckId: DECK, locale: "en" })

        expect(detail.deck).toMatchObject({ deckId: DECK, title: "en Module 1", cardCount: 20, added: true })
        expect(detail.sampleCards).toEqual([
            { cardId: "card:d/0", kind: "direct", question: "What is DI?" },
            { cardId: "card:d/1", kind: "cloze", question: "A ____ builds the graph" },
            { cardId: "card:d/2", kind: "cloze", question: "Why?" },
        ])
        expect(JSON.stringify(detail)).not.toContain("SECRET")
        expect(detail.progress).toEqual({ total: 20, learned: 8, remembering: 5, needsReview: 3 })
        expect(em.query).toHaveBeenCalledWith(SELECT_SAMPLE_CARDS, [DECK, 3])
        expect(em.query).toHaveBeenCalledWith(SELECT_DECK_PROGRESS, [REVIEW_LEARNER, DECK, "2026-11-08"])
    })
})

describe("ReviewDeckService deck pace and refusals", () => {
    it("paces new cards by the smaller of the daily goal and the cards not yet learned", async () => {
        const wide = await buildDetail({ goal: 30 })
        const narrow = await buildDetail({ goal: 5 })
        const unset = await buildDetail({ goal: null })

        await expect(wide.service.deck(REVIEW_LEARNER, { deckId: DECK, locale: "vi" })).resolves.toMatchObject({
            estimatedNewPerDay: 12,
        })
        await expect(narrow.service.deck(REVIEW_LEARNER, { deckId: DECK, locale: "vi" })).resolves.toMatchObject({
            estimatedNewPerDay: 5,
        })
        await expect(unset.service.deck(REVIEW_LEARNER, { deckId: DECK, locale: "vi" })).resolves.toMatchObject({
            estimatedNewPerDay: 10,
        })
    })

    it("shows no progress for a deck that is not added and paces it over all its cards", async () => {
        const { service, em } = await buildDetail({ added: false })

        const detail = await service.deck(REVIEW_LEARNER, { deckId: DECK, locale: "vi" })

        expect(detail.progress).toEqual({ total: 0, learned: 0, remembering: 0, needsReview: 0 })
        expect(detail.estimatedNewPerDay).toBe(10)
        expect(detail.sampleCards[0]?.question).toBe("vi What is DI?")
        expect(em.query).not.toHaveBeenCalledWith(SELECT_DECK_PROGRESS, expect.anything())
    })

    it("refuses an unknown deck with the not found code of the module", async () => {
        const { service } = await buildDetail({ deck: false })

        await expect(service.deck(REVIEW_LEARNER, { deckId: DECK, locale: "en" })).rejects.toMatchObject({
            code: ReviewErrorCode.DeckNotFound,
        })
    })
})
