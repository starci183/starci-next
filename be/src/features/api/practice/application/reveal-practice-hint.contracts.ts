import type { PracticeLocale } from "@modules/domain/practice"

/** The request of one step of the hint ladder to open. */
export interface RevealPracticeHintRequest {
    /** The slug. */
    readonly slug: string
    /** The step. */
    readonly step: number
    /** The locale. */
    readonly locale: PracticeLocale
}
