/** Ends the interview and grades the whole session once; it answers when the grading is done or has failed. */
export interface SubmitInterviewRequest {
    /** The sessionId. */
    readonly sessionId: string
}
