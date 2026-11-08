/** Events the review capability records; fields are counts, ids, versions and hashes, never a card text or an answer. */
export enum ReviewLogEvent {
    /** One deck was imported, left as it was, refused or found invalid. */
    DeckImported = "review.deck_imported",
    /** The streak report of a finished day failed; the review itself is stored. */
    StreakReportFailed = "review.streak_report_failed",
}
