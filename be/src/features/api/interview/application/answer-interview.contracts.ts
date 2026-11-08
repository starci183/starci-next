/** Stores the answer to the open question, then asks the interviewer what follows; it shows no score and no feedback. */
export interface AnswerInterviewRequest {
    /** The sessionId. */
    readonly sessionId: string
    /** The position. */
    readonly position: number
    /** The revision. */
    readonly revision: number
    /** The text. */
    readonly text: string
    /** The skip. */
    readonly isSkipped: boolean
}
