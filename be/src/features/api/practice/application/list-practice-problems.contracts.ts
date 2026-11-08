import type { PracticeLocale } from "@modules/domain/practice"

/** The request of the problems of one pattern. */
export interface ListPracticeProblemsRequest {
    /** The patternId. */
    readonly patternId: string
    /** The locale. */
    readonly locale: PracticeLocale
}
