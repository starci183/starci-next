import { join } from "node:path"
import { learnersOf } from "../../fixtures/builders/identity.builder"
import { seedSqlOf } from "../../fixtures/builders/seed.builder"
import { attemptDoors, type AttemptDoors, type GraphqlBody } from "../../world/attempt-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

const SEED = join(__dirname, "../../../../../.starcistacks/dev/seeds/sql/primary-review.sql")
const DECK = "0-fullstack-mastery/0-module-1"
const FREE_CARD = `card:${DECK}/0`
const PREMIUM_CARD = `card:${DECK}/3`

interface GoalProgress {
    readonly daily: number
    readonly done: number
}

interface TodayItem {
    readonly itemId: string
    readonly locked: boolean
    readonly source: string
}

interface TodayData {
    readonly date: string
    readonly due: number
    readonly newAvailable: number
    readonly lockedCount: number
    readonly goal: GoalProgress
    readonly items: ReadonlyArray<TodayItem>
}

interface TodayBody {
    readonly reviewToday: TodayData
}

interface DeckData {
    readonly deckId: string
    readonly added: boolean
    readonly cardCount: number
    readonly freeCardCount: number
}

interface DeckBody {
    readonly reviewDecks: ReadonlyArray<DeckData>
}

interface ItemData {
    readonly question: string
    readonly flipped: boolean
    readonly revision: number
}

interface ItemBody {
    readonly recallItem: ItemData
}

interface IntervalsData {
    readonly again: number
    readonly hard: number
    readonly good: number
    readonly easy: number
}

interface FlipData {
    readonly answer: string
    readonly revision: number
    readonly intervals: IntervalsData
}

interface FlipBody {
    readonly flipReviewCard: FlipData
}

interface GradeData {
    readonly status: string
    readonly step: number
    readonly goal: GoalProgressDone
}

interface GoalProgressDone {
    readonly done: number
}

interface GradeBody {
    readonly gradeReviewCard: GradeData
}

const TODAY = `query Today($input: RecallTodayInput!) {
  reviewToday(input: $input) { date due newAvailable lockedCount goal { daily done } items { itemId locked source } }
}`
const DECKS = `query Decks($input: RecallDecksInput!) { reviewDecks(input: $input) { deckId added cardCount freeCardCount } }`
const ITEM = `query Item($input: RecallItemInput!) { recallItem(input: $input) { question flipped revision } }`
const ADD = `mutation Add($input: RecallDeckInput!) { addReviewDeck(input: $input) { deckId added newCards } }`
const FLIP = `mutation Flip($input: FlipRecallCardInput!) {
  flipReviewCard(input: $input) { answer revision intervals { again hard good easy } }
}`
const GRADE = `mutation Grade($input: GradeRecallCardInput!) {
  gradeReviewCard(input: $input) { itemId status step dueOn goal { daily done } }
}`
const GOAL = `mutation Goal($input: SetRecallGoalInput!) { setReviewGoal(input: $input) { daily } }`

const codeOf = (answer: GraphqlBody<unknown>): unknown => answer.errors?.[0]?.extensions

/** Boots the core app and stores the dev subset of the decks before each spec. */
const useReviewDoors = (): AttemptDoors => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = attemptDoors(world)
    beforeEach(async () => {
        await doors.reset()
        await doors.db()?.query(seedSqlOf(SEED))
    })
    return doors
}

/**
 * The review doors (integration): the real core app behind the real session guard, over the dev subset of the teacher's decks.
 * It proves the session gate, that a card's answer is not served before the flip, the free and Premium cut by the teacher's flag,
 * the self-grade once per revision and the goal range.
 */
describe("review doors (integration)", () => {
    const doors = useReviewDoors()
    const nextLearner = learnersOf("c8")

    it.each([
        [TODAY, { input: { locale: "vi" } }],
        [DECKS, { input: { locale: "vi" } }],
        [GRADE, { input: { itemId: FREE_CARD, revision: 1, grade: "GOOD" } }],
    ])("refuses a caller with no session", async (query, variables) => {
        const answer = await doors.ask(query, variables)

        expect(answer.data ?? null).toBeNull()
        expect(codeOf(answer)).toMatchObject({ code: "IDENTITY_SESSION_REQUIRED", kind: "unauthenticated" })
    })

    it("lists the decks, adds one and queues its cards with the Premium ones locked for a free learner", async () => {
        const { cookie } = await doors.signIn(nextLearner(), false)

        const decks = await doors.ask<DeckBody>(DECKS, { input: { locale: "vi" } }, cookie)
        const added = await doors.ask(ADD, { input: { deckId: DECK } }, cookie)
        const today = await doors.ask<TodayBody>(TODAY, { input: { locale: "vi" } }, cookie)

        const deck = decks.data?.reviewDecks.find((candidate) => candidate.deckId === DECK)
        expect(deck).toMatchObject({ added: false, cardCount: 20, freeCardCount: 3 })
        expect(added.errors).toBeUndefined()
        expect(today.data?.reviewToday.items.filter((item) => !item.locked)).toHaveLength(3)
        expect(today.data?.reviewToday.lockedCount).toBe(17)
        expect(today.data?.reviewToday.goal).toEqual({ daily: 10, done: 0 })
    })
})

/** The review doors once a deck is added: the flip and self-grade, the Premium cut, what does not exist and the goal. */
describe("review doors grading (integration)", () => {
    const doors = useReviewDoors()
    const nextLearner = learnersOf("c8")

    it("serves the question without the answer, grades only after the flip, and moves the item once per revision", async () => {
        const { cookie } = await doors.signIn(nextLearner(), false)
        await doors.ask(ADD, { input: { deckId: DECK } }, cookie)

        const item = await doors.ask<ItemBody>(ITEM, { input: { itemId: FREE_CARD, locale: "vi" } }, cookie)
        const early = await doors.ask(GRADE, { input: { itemId: FREE_CARD, revision: 1, grade: "GOOD" } }, cookie)
        const flip = await doors.ask<FlipBody>(FLIP, { input: { itemId: FREE_CARD, locale: "vi" } }, cookie)
        const revision = flip.data?.flipReviewCard.revision ?? 0
        const grade = await doors.ask<GradeBody>(
            GRADE,
            { input: { itemId: FREE_CARD, revision, grade: "GOOD" } },
            cookie,
        )
        const again = await doors.ask<GradeBody>(
            GRADE,
            { input: { itemId: FREE_CARD, revision, grade: "GOOD" } },
            cookie,
        )
        const conflict = await doors.ask(GRADE, { input: { itemId: FREE_CARD, revision, grade: "EASY" } }, cookie)

        expect(JSON.stringify(item.data)).not.toContain("{{c1")
        expect(item.data?.recallItem.flipped).toBe(false)
        expect(codeOf(early)).toMatchObject({ code: "REVIEW_NOT_FLIPPED", kind: "conflict" })
        expect(flip.data?.flipReviewCard.answer.length).toBeGreaterThan(0)
        expect(flip.data?.flipReviewCard.intervals.good).toBeGreaterThan(flip.data?.flipReviewCard.intervals.again ?? 0)
        expect(grade.data?.gradeReviewCard).toMatchObject({ status: "learning", goal: { done: 1 } })
        expect(again.data?.gradeReviewCard.goal.done).toBe(1)
        expect(codeOf(conflict)).toMatchObject({ code: "REVIEW_REVISION_CONFLICT", kind: "conflict" })
    })

    it("refuses a Premium card to a free learner and serves it to a Premium one", async () => {
        const free = await doors.signIn(nextLearner(), false)
        const paid = await doors.signIn(nextLearner(), true)
        await doors.ask(ADD, { input: { deckId: DECK } }, paid.cookie)
        await doors.ask(ADD, { input: { deckId: DECK } }, free.cookie)

        const refused = await doors.ask(ITEM, { input: { itemId: PREMIUM_CARD, locale: "vi" } }, free.cookie)
        const served = await doors.ask<ItemBody>(ITEM, { input: { itemId: PREMIUM_CARD, locale: "vi" } }, paid.cookie)

        expect(codeOf(refused)).toMatchObject({ code: "REVIEW_PREMIUM_REQUIRED", kind: "forbidden" })
        expect(served.data?.recallItem.question.length).toBeGreaterThan(0)
    })

    it("answers 404 REVIEW_ITEM_NOT_FOUND and REVIEW_DECK_NOT_FOUND for what does not exist", async () => {
        const { cookie } = await doors.signIn(nextLearner(), false)

        const item = await doors.ask(ITEM, { input: { itemId: "card:nope/0", locale: "vi" } }, cookie)
        const deck = await doors.ask(ADD, { input: { deckId: "nope/none" } }, cookie)

        expect(codeOf(item)).toMatchObject({ code: "REVIEW_ITEM_NOT_FOUND", kind: "not-found" })
        expect(codeOf(deck)).toMatchObject({ code: "REVIEW_DECK_NOT_FOUND", kind: "not-found" })
    })

    it.each([4, 51])("answers REVIEW_GOAL_INVALID for a daily goal of %s", async (daily) => {
        const { cookie } = await doors.signIn(nextLearner(), false)

        const answer = await doors.ask(GOAL, { input: { daily } }, cookie)

        expect(codeOf(answer)).toMatchObject({ code: "REVIEW_GOAL_INVALID", kind: "invalid" })
    })

    it("stores a daily goal and shows it in the queue", async () => {
        const { cookie } = await doors.signIn(nextLearner(), false)

        await doors.ask(GOAL, { input: { daily: 20 } }, cookie)
        const today = await doors.ask<TodayBody>(TODAY, { input: { locale: "vi" } }, cookie)

        expect(today.data?.reviewToday.goal.daily).toBe(20)
    })
})
