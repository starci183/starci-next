import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import { LessonContentService, LessonReadService } from "@modules/domain/lesson"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { clozeChoices, revealAnswer } from "./cloze.policy"
import { ReviewError, ReviewErrorCode } from "./errors/review.error"
import type { CardRow, StateRow } from "./persistence/review.rows"
import { INSERT_ANSWER, MARK_FLIPPED, SELECT_CARD, SELECT_STATE } from "./persistence/review.sql"
import { InjectReviewScheduler } from "./review-scheduler.port"
import type { ReviewScheduler } from "./review-scheduler.policy"
import type {
    ReviewClozeResult,
    ReviewFlipView,
    ReviewItemView,
    ReviewLocale,
    ReviewRetrievalRef,
} from "./review.contracts"

/** The longest written answer to a retrieval item. */
const ANSWER_MAX_LENGTH = 4000

/** A card or a retrieval item the learner holds, with the content of a card when the item is one. */
export interface HeldItem {
    /** The learner's state for the item. */
    readonly state: StateRow
    /** The card of the live deck version; null for a retrieval item. */
    readonly card: CardRow | null
}

@Injectable()
/** Serves one item at a time: the question, the cloze check, the answer after a flip or a written answer, and nothing earlier. */
export class ReviewItemService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
        @InjectReviewScheduler() private readonly scheduler: ReviewScheduler,
        private readonly content: LessonContentService,
        private readonly lessons: LessonReadService,
    ) {}

    /**
     * The item the learner holds, once Premium is checked: a retrieval item and a card flagged isPremium need it. Not found when
     * the learner holds no such item or its card is no longer published.
     */
    async hold(learnerId: string, itemId: string): Promise<HeldItem> {
        const states: Array<StateRow> = await this.entityManager.query(SELECT_STATE, [learnerId, itemId])
        const state = states[0]
        if (state === undefined) throw new ReviewError({ code: ReviewErrorCode.ItemNotFound })
        const cards: Array<CardRow> =
            state.source === "flashcard" ? await this.entityManager.query(SELECT_CARD, [itemId]) : []
        const card = cards[0] ?? null
        if (state.source === "flashcard" && card === null) throw new ReviewError({ code: ReviewErrorCode.ItemNotFound })
        if ((card === null || card.is_premium) && !(await this.entitlement.isPremium(learnerId)))
            throw new ReviewError({ code: ReviewErrorCode.PremiumRequired })
        return { state, card }
    }

    /** The question of the item with its cloze checks, and nothing of the answer or a cloze term. */
    async item(learnerId: string, itemId: string, locale: ReviewLocale): Promise<ReviewItemView> {
        const { state, card } = await this.hold(learnerId, itemId)
        const revision = state.last_revision + 1
        const flipped = state.flipped_revision === revision
        if (card !== null) {
            return {
                itemId,
                source: "flashcard",
                question: card.front[locale].question,
                level: card.level,
                tags: card.front[locale].tags,
                langs: card.langs === null ? [] : [card.langs],
                cloze: card.back[locale].clozes.map((cloze) => ({
                    n: cloze.n,
                    choices: clozeChoices(cloze, `${learnerId}:${itemId}:${cloze.n}`),
                })),
                lessonId: null,
                activityId: null,
                deckTitle: card.deck_titles[locale],
                lessonTitle: null,
                revision,
                flipped,
            }
        }
        const ref = this.refOf(state)
        const { activity } = await this.content.activity({ ...ref, locale })
        return {
            itemId,
            source: "retrieval",
            question: activity.prompt,
            level: null,
            tags: [],
            langs: [],
            cloze: [],
            lessonId: ref.lessonId,
            activityId: ref.activityId,
            deckTitle: null,
            lessonTitle: await this.lessonTitle(ref.lessonId, locale),
            revision,
            flipped,
        }
    }

    /** Checks a picked choice against the hidden term of a cloze; it answers correct or not and nothing else. */
    async checkCloze(
        learnerId: string,
        itemId: string,
        n: number,
        choice: string,
        locale: ReviewLocale,
    ): Promise<ReviewClozeResult> {
        const { card } = await this.hold(learnerId, itemId)
        const cloze = card?.back[locale].clozes.find((candidate) => candidate.n === n)
        if (cloze === undefined) throw new ReviewError({ code: ReviewErrorCode.AnswerInvalid })
        return { correct: choice === cloze.term }
    }

    /** Reveals the answer of a card with its cloze terms, and the days each grade would give. */
    async flip(learnerId: string, itemId: string, locale: ReviewLocale): Promise<ReviewFlipView> {
        const { state, card } = await this.hold(learnerId, itemId)
        if (card === null) throw new ReviewError({ code: ReviewErrorCode.AnswerInvalid })
        const revision = state.last_revision + 1
        await this.entityManager.query(MARK_FLIPPED, [learnerId, itemId, revision])
        return {
            itemId,
            revision,
            answer: revealAnswer(card.back[locale].answer),
            intervals: this.scheduler.preview({ step: state.step }),
        }
    }

    /**
     * Stores the written answer of a learner to a retrieval item, then shows the sample answer of the lesson and the days each
     * grade would give. The answer is stored before the sample answer leaves the server; a resend of the same revision answers
     * the same.
     */
    async submitRetrieval(
        learnerId: string,
        itemId: string,
        revision: number,
        text: string,
        locale: ReviewLocale,
    ): Promise<ReviewFlipView> {
        const { state, card } = await this.hold(learnerId, itemId)
        const answer = text.trim()
        if (card !== null || answer === "" || answer.length > ANSWER_MAX_LENGTH)
            throw new ReviewError({ code: ReviewErrorCode.AnswerInvalid })
        if (revision !== state.last_revision + 1) throw new ReviewError({ code: ReviewErrorCode.RevisionConflict })
        const found = await this.content.activity({ ...this.refOf(state), locale })
        await this.entityManager.transaction(async (manager) => {
            await manager.query(INSERT_ANSWER, [learnerId, itemId, revision, answer, this.clock.now()])
            await manager.query(MARK_FLIPPED, [learnerId, itemId, revision])
        })
        const sample = found.activity.answer?.sampleAnswer ?? found.activity.answer?.explanation ?? ""
        const retry = this.scheduler.scheduleRetrieval("again").intervalDays
        return {
            itemId,
            revision,
            answer: sample,
            intervals: { again: retry, hard: retry, good: 0, easy: 0 },
        }
    }

    /** The lesson, version and activity of a retrieval state; a state without them is not an item the learner can open. */
    private refOf(state: StateRow): ReviewRetrievalRef {
        if (state.lesson_id === null || state.lesson_version === null || state.activity_id === null)
            throw new ReviewError({ code: ReviewErrorCode.ItemNotFound })
        return { lessonId: state.lesson_id, version: state.lesson_version, activityId: state.activity_id }
    }

    private async lessonTitle(lessonId: string, locale: ReviewLocale): Promise<string> {
        const catalog = await this.lessons.catalog({
            locale,
            group: null,
            topic: null,
            category: null,
            difficulty: null,
            language: null,
            provider: null,
            q: null,
        })
        return catalog.find((lesson) => lesson.id === lessonId)?.title ?? lessonId
    }
}
