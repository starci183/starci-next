/** Grades a session again after a failed grading; the transcript is kept and the learner is not asked again. */
export interface RegradeInterviewRequest {
    /** The sessionId. */
    readonly sessionId: string
}
