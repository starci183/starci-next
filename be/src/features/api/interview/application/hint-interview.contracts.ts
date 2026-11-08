/** Gives the next authored hint of the open question; each hint used takes a little off that question. */
export interface HintInterviewRequest {
    /** The sessionId. */
    readonly sessionId: string
    /** The position. */
    readonly position: number
}
