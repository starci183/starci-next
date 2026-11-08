import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { ReviewSourceDeck, ReviewSourceFile } from "./review.contracts"

/**
 * The port that reads deck folders from a checkout of starci-lab/data. An object, not a bare function, so a unit spec doubles
 * it with `mock<ReviewSourceReader>()`.
 */
export interface ReviewSourceReader {
    /** Lists the deck folders `courses/<course>/flashcard-decks/<n>-<deck>` of the checkout, in course and deck order. */
    decks(directory: string): Promise<ReadonlyArray<ReviewSourceDeck>>
    /** Reads every file below one deck folder, with the hash of its raw bytes, sorted by path. */
    read(directory: string, deck: ReviewSourceDeck): Promise<ReadonlyArray<ReviewSourceFile>>
}

/** Token of the port that reads deck folders. */
export const REVIEW_SOURCE: unique symbol = Symbol("domain.review.source")

/** Injects the port that reads deck folders. Parameter type: ReviewSourceReader. */
export const InjectReviewSource = (): TypedParameterDecorator<ReviewSourceReader> =>
    injector<ReviewSourceReader>(REVIEW_SOURCE)
