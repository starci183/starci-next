/** The request of a submit of the solution against every test. */
export interface SubmitPracticeRequest {
    /** The slug. */
    readonly slug: string
    /** The language. */
    readonly language: string
    /** The source. */
    readonly source: string
}
