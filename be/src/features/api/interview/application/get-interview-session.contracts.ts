/** Reads a session; the scorecard, the ideal answers and the lessons appear only once it is graded. */
export interface GetInterviewSessionRequest {
    /** The sessionId. */
    readonly sessionId: string
}
