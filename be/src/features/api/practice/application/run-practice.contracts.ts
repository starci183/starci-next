/** The request of a run of the solution against the public example. */
export interface RunPracticeRequest {
    /** The slug. */
    readonly slug: string
    /** The language. */
    readonly language: string
    /** The source. */
    readonly source: string
}
