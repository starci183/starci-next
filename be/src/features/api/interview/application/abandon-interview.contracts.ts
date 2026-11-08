/** Abandons the active session; an abandoned free session still counts for its month. */
export interface AbandonInterviewRequest {
    /** The sessionId. */
    readonly sessionId: string
}
