/** Reads the sessions of the learner and the score trend per track and tier. */
export interface GetInterviewHistoryRequest {
    /** The track. */
    readonly track: string | null
}
