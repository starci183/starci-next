import type { ProgressLocale } from "@modules/domain/progress"

/** The request of the learnerProgress door. */
export interface GetLearnerProgressRequest {
    /** The locale of the lesson titles and of the harness titles. */
    readonly locale: ProgressLocale
}
