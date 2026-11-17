import type { PracticeLocale } from "@modules/domain/practice"

/** The request of the problem to do next and the problem to resume. */
export interface GetPracticeNextRequest {
    /** The pattern to restrict both to, or null for the whole catalog. */
    readonly patternId: string | null
    /** The locale. */
    readonly locale: PracticeLocale
}
