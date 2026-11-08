import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { eachInOrder } from "@modules/platform/primitives"
import { buildDeckDraft, deckHashOf } from "./deck-draft.policy"
import { ReviewError, ReviewErrorCode } from "./errors/review.error"
import type { DeckHashRow } from "./persistence/review.rows"
import { INSERT_CARDS, INSERT_DECK_VERSION, SELECT_DECK_VERSION_HASH, UPSERT_DECK } from "./persistence/review.sql"
import { InjectReviewSource, type ReviewSourceReader } from "./review-source.port"
import { ReviewLogEvent } from "./review.log-events"
import type { ImportReviewDecksParams, ReviewDeckDraft, ReviewImportReport, ReviewSourceDeck } from "./review.contracts"

@Injectable()
/**
 * Imports deck folders as immutable deck versions: the whole folder is read, parsed and validated before anything is written;
 * an identical version is left alone, other bytes under a stored version are refused, and a folder that fails never touches the
 * version that is live.
 */
export class ReviewImportService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectReviewSource() private readonly source: ReviewSourceReader,
        @InjectLogger() private readonly logger: Logger,
    ) {}

    /**
     * Imports the decks of a checkout under one version label and logs one report line per deck (counts, version and hash,
     * never a card text). Every deck is tried; afterwards a refused or invalid deck fails the call.
     */
    async import(params: ImportReviewDecksParams): Promise<ReadonlyArray<ReviewImportReport>> {
        if (params.directory.trim() === "" || params.ref.trim() === "")
            throw new ReviewError({ code: ReviewErrorCode.ImportRejected })
        const present = await this.source.decks(params.directory)
        const wanted = params.only.split(",").filter((name) => name !== "")
        const missing = wanted.filter((name) => !present.some((deck) => deck.deckId === name))
        if (missing.length > 0)
            throw new ReviewError({ code: ReviewErrorCode.ImportRejected, params: { decks: missing.join(", ") } })
        const chosen = wanted.length === 0 ? present : present.filter((deck) => wanted.includes(deck.deckId))
        const reports: Array<ReviewImportReport> = []
        await eachInOrder(chosen, async (deck) => {
            const report = await this.importDeck(params, deck)
            this.logger.info(ReviewLogEvent.DeckImported, { ...report })
            reports.push(report)
        })
        const failed = reports.filter((report) => report.status === "refused" || report.status === "invalid")
        if (failed.length > 0) {
            const code = failed.some((report) => report.status === "refused")
                ? ReviewErrorCode.DeckImmutable
                : ReviewErrorCode.DeckInvalid
            throw new ReviewError({ code, params: { decks: failed.map((report) => report.deckId).join(", ") } })
        }
        return reports
    }

    private async importDeck(params: ImportReviewDecksParams, deck: ReviewSourceDeck): Promise<ReviewImportReport> {
        const files = await this.source.read(params.directory, deck)
        const { draft, issues } = buildDeckDraft(deck.course, deck.folder, files)
        const base = {
            deckId: deck.deckId,
            version: params.ref,
            contentHash: deckHashOf(files),
            files: files.length,
        }
        if (draft === null) return { ...base, status: "invalid", cards: 0, freeCards: 0, issues }
        const counts = {
            cards: draft.cards.length,
            freeCards: draft.cards.filter((card) => !card.isPremium).length,
        }
        const stored: Array<DeckHashRow> = await this.entityManager.query(SELECT_DECK_VERSION_HASH, [
            draft.deckId,
            params.ref,
        ])
        const held = stored[0]
        if (held?.content_hash === draft.contentHash) return { ...base, ...counts, status: "unchanged", issues: [] }
        if (held !== undefined) {
            const message = `version ${params.ref} is stored with hash ${held.content_hash}, the source has ${draft.contentHash}`
            return { ...base, ...counts, status: "refused", issues: [{ path: deck.deckId, field: "", message }] }
        }
        await this.store(draft, params.ref, counts.freeCards)
        return { ...base, ...counts, status: "created", issues: [] }
    }

    private store(draft: ReviewDeckDraft, version: string, freeCards: number): Promise<void> {
        const now = this.clock.now()
        return this.entityManager.transaction(async (manager) => {
            const inserted: Array<DeckHashRow> = await manager.query(INSERT_DECK_VERSION, [
                draft.deckId,
                version,
                draft.contentHash,
                JSON.stringify(draft.sourceHashes),
                now,
            ])
            if (inserted.length === 0) throw new ReviewError({ code: ReviewErrorCode.DeckImmutable })
            await manager.query(INSERT_CARDS, [
                draft.deckId,
                version,
                JSON.stringify(
                    draft.cards.map((card) => ({
                        item_id: card.itemId,
                        sort_index: card.sortIndex,
                        is_premium: card.isPremium,
                        level: card.level,
                        langs: card.langs,
                        front: card.front,
                        back: card.back,
                    })),
                ),
            ])
            await manager.query(UPSERT_DECK, [
                draft.deckId,
                draft.course,
                draft.sortIndex,
                version,
                draft.difficulty,
                JSON.stringify(draft.titles),
                JSON.stringify(draft.descriptions),
                JSON.stringify(draft.moduleRefs),
                JSON.stringify(draft.tracks),
                draft.cards.length,
                freeCards,
                now,
            ])
        })
    }
}
