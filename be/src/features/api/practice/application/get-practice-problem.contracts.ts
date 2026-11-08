import type { PracticeLocale } from "@modules/domain/practice"

/** The request of one problem to open. */
export interface GetPracticeProblemRequest {
    /** The slug. */
    readonly slug: string
    /** The locale. */
    readonly locale: PracticeLocale
}
