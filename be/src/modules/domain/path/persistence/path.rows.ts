/** One choice in the history of a learner. */
export interface PathHistoryRow {
    /** The path chosen. */
    pathId: string
    /** When it was chosen, an ISO instant. */
    chosenAt: string
}

/** The choice of one learner as the database answers it. */
export interface ChoiceRow {
    /** The path followed now. */
    active_path_id: string
    /** When it was chosen, an ISO instant. */
    chosen_at: string
}
