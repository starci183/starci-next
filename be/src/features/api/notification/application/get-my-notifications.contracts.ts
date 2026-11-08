/** What a page of the caller's notifications takes: the cursor of the page before and the most rows wanted. */
export interface GetMyNotificationsRequest {
    /** The cursor the page before answered, or null for the first page. */
    readonly after: string | null
    /** The most notifications wanted, or null for the default. */
    readonly limit: number | null
}
