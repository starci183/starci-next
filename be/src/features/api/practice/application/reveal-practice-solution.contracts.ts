import type { PracticeLocale } from "@modules/domain/practice"

/** The request to reveal the reference solution of one problem. */
export interface RevealPracticeSolutionRequest {
    /** The slug. */
    readonly slug: string
    /** The locale. */
    readonly locale: PracticeLocale
}
