import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, type sql } from "@modules/platform/database"
import { ReviewError, ReviewErrorCode } from "./errors/review.error"
import { blankClozes } from "./cloze.policy"
import type {
    AffectedRow,
    CountRow,
    DeckProgressRow,
    DeckRow,
    GoalRow,
    RecallRow,
    SampleCardRow,
} from "./persistence/review.rows"
import {
    COUNT_ACTIVE_DAYS,
    INSERT_DECK_STATES,
    RESTORE_DECK_STATES,
    SELECT_DECK,
    SELECT_DECKS,
    SELECT_DECK_EXISTS,
    SELECT_DECK_PROGRESS,
    SELECT_GOAL,
    SELECT_SAMPLE_CARDS,
    SELECT_RECALL,
    SUSPEND_DECK_STATES,
    UPSERT_GOAL,
    UPSERT_LEARNER_DECK,
} from "./persistence/review.sql"
import { addDays, dayOf } from "@modules/domain/streak"
import {
    REVIEW_GOAL_DEFAULT,
    REVIEW_GOAL_MAX,
    REVIEW_GOAL_MIN,
    type ReviewDeckDetailView,
    type ReviewDeckQuery,
    type ReviewDecksQuery,
    type ReviewDeckAddedView,
    type ReviewDeckRemovedView,
    type ReviewDeckView,
    type ReviewGoalSetView,
    type ReviewLocale,
    type ReviewStatsQuery,
    type ReviewStatsView,
} from "./review.contracts"

/** The most decks listed. */
const DECKS_MAX = 200

/** How many cards a deck shows as a sample. */
const SAMPLE_CARDS = 3

/** How many days the statistics look back unless the caller says. */
const STATS_DAYS_DEFAULT = 28

@Injectable()
/** The decks of the picker, adding and removing a deck, the daily goal and the statistics. */
export class ReviewDeckService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
    ) {}

    /** Lists the decks in course order with whether the learner added each, optionally for one outcome track. */
    async decks(learnerId: string, query: ReviewDecksQuery): Promise<ReadonlyArray<ReviewDeckView>> {
        const { locale, track } = query
        const rows: Array<DeckRow> = await this.entityManager.query(SELECT_DECKS, [learnerId, track ?? null, DECKS_MAX])
        return rows.map((row) => toDeckView(row, locale))
    }

    /**
     * One deck with its first cards as questions (never an answer), what the viewer has done with it and how many new cards a day
     * the goal brings. A deck that is not added has no progress.
     */
    async deck(learnerId: string, query: ReviewDeckQuery): Promise<ReviewDeckDetailView> {
        const { locale, deckId } = query
        const decks: Array<DeckRow> = await this.entityManager.query(SELECT_DECK, [learnerId, deckId])
        const row = decks[0]
        if (row === undefined) throw new ReviewError({ code: ReviewErrorCode.DeckNotFound })
        const today = dayOf(this.clock.now())
        const [cards, progress, goals] = await Promise.all([
            this.rows<SampleCardRow>(SELECT_SAMPLE_CARDS, [deckId, SAMPLE_CARDS]),
            row.added
                ? this.rows<DeckProgressRow>(SELECT_DECK_PROGRESS, [learnerId, deckId, today])
                : Promise.resolve([]),
            this.rows<GoalRow>(SELECT_GOAL, [learnerId]),
        ])
        const held = progress[0]
        const total = held?.total ?? 0
        const learned = held?.learned ?? 0
        const remembering = held?.remembering ?? 0
        const goal = goals[0]?.daily_goal ?? REVIEW_GOAL_DEFAULT
        return {
            deck: toDeckView(row, locale),
            sampleCards: cards.map((card) => ({
                cardId: card.item_id,
                kind: card.back[locale].clozes.length > 0 ? "cloze" : "direct",
                question: blankClozes(card.front[locale].question),
            })),
            progress: { total, learned, remembering, needsReview: learned - remembering },
            estimatedNewPerDay: Math.max(0, Math.min(goal, (row.added ? total : row.card_count) - learned)),
        }
    }

    /** Gives the learner the cards of a deck, due today; a deck removed earlier comes back with its history. */
    async add(learnerId: string, deckId: string): Promise<ReviewDeckAddedView> {
        await this.requireDeck(deckId)
        const now = this.clock.now()
        const created = await this.entityManager.transaction(async (manager) => {
            await manager.query(UPSERT_LEARNER_DECK, [learnerId, deckId, true, now])
            await manager.query(RESTORE_DECK_STATES, [learnerId, deckId, now])
            const inserted: Array<AffectedRow> = await manager.query(INSERT_DECK_STATES, [
                learnerId,
                deckId,
                dayOf(now),
                now,
            ])
            return inserted.length
        })
        return { deckId, added: true, newCards: created }
    }

    /** Suspends the items of a deck and keeps their history; adding the deck again brings them back. */
    async remove(learnerId: string, deckId: string): Promise<ReviewDeckRemovedView> {
        await this.requireDeck(deckId)
        const now = this.clock.now()
        const suspended = await this.entityManager.transaction(async (manager) => {
            await manager.query(UPSERT_LEARNER_DECK, [learnerId, deckId, false, now])
            const rows: Array<AffectedRow> = await manager.query(SUSPEND_DECK_STATES, [learnerId, deckId, now])
            return rows.length
        })
        return { deckId, added: false, suspended }
    }

    /** Sets the daily item goal, 5 to 50. */
    async setGoal(learnerId: string, daily: number): Promise<ReviewGoalSetView> {
        if (!Number.isInteger(daily) || daily < REVIEW_GOAL_MIN || daily > REVIEW_GOAL_MAX)
            throw new ReviewError({ code: ReviewErrorCode.GoalInvalid })
        await this.entityManager.query(UPSERT_GOAL, [learnerId, daily, this.clock.now()])
        return { daily }
    }

    /** The active days a week over the last days, and the recall rate of the first three reviews of items. */
    async stats(learnerId: string, query: ReviewStatsQuery): Promise<ReviewStatsView> {
        const span = query.days ?? STATS_DAYS_DEFAULT
        const since = addDays(dayOf(this.clock.now()), -(span - 1))
        const [active, recall] = await Promise.all([
            this.rows<CountRow>(COUNT_ACTIVE_DAYS, [learnerId, since]),
            this.rows<RecallRow>(SELECT_RECALL, [learnerId]),
        ])
        return {
            activeDaysPerWeek: Math.round((((active[0]?.total ?? 0) * 7) / span) * 10) / 10,
            recallRateByReview: recall.map((row) => ({
                n: row.n,
                rate: row.total === 0 ? 0 : row.recalled / row.total,
            })),
        }
    }

    private rows<Row>(query: ReturnType<typeof sql>, params: ReadonlyArray<unknown>): Promise<Array<Row>> {
        return this.entityManager.query(query, [...params])
    }

    private async requireDeck(deckId: string): Promise<void> {
        const rows: Array<CountRow> = await this.entityManager.query(SELECT_DECK_EXISTS, [deckId])
        if ((rows[0]?.total ?? 0) === 0) throw new ReviewError({ code: ReviewErrorCode.DeckNotFound })
    }
}

/** One deck row as the picker lists it, titled in a locale. */
const toDeckView = (row: DeckRow, locale: ReviewLocale): ReviewDeckView => ({
    deckId: row.deck_id,
    course: row.course,
    title: row.titles[locale],
    description: row.descriptions[locale],
    difficulty: row.difficulty,
    cardCount: row.card_count,
    added: row.added,
    track: row.tracks,
})
