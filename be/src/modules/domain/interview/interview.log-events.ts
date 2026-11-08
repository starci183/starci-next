/** Events the interview capability records; fields are ids, kinds, counts and codes, never an answer, a quote, a rubric or a prompt. */
export enum InterviewLogEvent {
    /** One bank folder was imported, left alone or refused. */
    Imported = "interview.bank_imported",
    /** A bank version was published. */
    Published = "interview.bank_published",
    /** A calibration pre-check ran. */
    Calibrated = "interview.bank_calibrated",
    /** The interviewer step failed, so the answer stays saved and the step can be retried. */
    ReplyFailed = "interview.reply_failed",
    /** The grading failed, so the session is marked failed and can be graded again. */
    GradingFailed = "interview.grading_failed",
    /** The streak service could not record the submitted session. */
    StreakFailed = "interview.streak_failed",
}
