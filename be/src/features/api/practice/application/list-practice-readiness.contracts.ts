import type { PracticeLocale } from "@modules/domain/practice"

/** The request of the readiness per pattern. */
export interface ListPracticeReadinessRequest {
    /** The locale. */
    readonly locale: PracticeLocale
}
