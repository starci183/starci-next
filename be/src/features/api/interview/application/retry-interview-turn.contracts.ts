/** Asks the interviewer again for the turn a failure skipped; the learner never answers twice. */
export interface RetryInterviewTurnRequest {
    /** The sessionId. */
    readonly sessionId: string
}
