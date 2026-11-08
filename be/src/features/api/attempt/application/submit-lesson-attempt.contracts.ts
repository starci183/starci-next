import type { AttemptAnswer } from "@modules/domain/attempt"
import type { LessonLocale } from "@modules/domain/lesson"

/** The answer of a learner to one activity of a lesson version, under a revision. */
export interface SubmitLessonAttemptRequest {
    /** The lesson. */
    readonly lessonId: string
    /** The version the learner studies. */
    readonly version: string
    /** The activity. */
    readonly activityId: string
    /** The revision of the answer to the activity. */
    readonly revision: number
    /** The locale of the text of the learner and of the feedback. */
    readonly locale: LessonLocale
    /** The answer. */
    readonly answer: AttemptAnswer
}
