/** Events the practice capability records; fields are ids, kinds, counts and codes, never source code, a test or a solution. */
export enum PracticeLogEvent {
    /** One problem folder was imported or left alone. */
    Imported = "practice.imported",
    /** The judge failed or answered something unusable, so the submission was marked an internal error. */
    JudgingFailed = "practice.judging_failed",
    /** The streak port refused the action of a graded attempt; the attempt stays graded. */
    StreakFailed = "practice.streak_failed",
}
