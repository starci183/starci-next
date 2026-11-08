import type { PracticeLocale } from "@modules/domain/practice"

/** The request of the pattern list of the signed-in learner. */
export interface ListPracticePatternsRequest {
    /** The locale. */
    readonly locale: PracticeLocale
}
