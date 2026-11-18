import type { PracticeLocale } from "@modules/domain/practice"

/** The request of one page of the caller's graded submits in one pattern. */
export interface ListPracticeSubmissionsRequest {
    /** The pattern. */
    readonly patternId: string
    /** The locale of the problem titles. */
    readonly locale: PracticeLocale
    /** The most submissions wanted, or null for the default. */
    readonly limit: number | null
    /** The cursor the page before answered, or null for the first page. */
    readonly cursor: string | null
}
