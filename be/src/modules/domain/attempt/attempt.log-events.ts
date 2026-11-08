/** Events the attempt capability records; fields are ids, kinds and codes, never an answer, a quote or a rubric. */
export enum AttemptLogEvent {
    /** The coach failed or answered something the rubric refuses, so the attempt was marked failed. */
    GradingFailed = "attempt.grading_failed",
    /** The streak or the review schedule could not be told about a graded attempt; the attempt stays graded. */
    AfterGradedFailed = "attempt.after_graded_failed",
}
