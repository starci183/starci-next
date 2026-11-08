/** The row HIT_RATE_WINDOW answers. */
export interface RateWindowRow {
    /** The hits of the caller's current window, this one included. */
    readonly hits: number
    /** The instant the caller's current window ends. */
    readonly resetAt: Date | string
}
