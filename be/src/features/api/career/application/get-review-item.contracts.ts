/** What reads one item and its audit trail for a signer takes. */
export interface GetReviewItemRequest {
    /** The item. */
    readonly itemId: string
    /** The roles the verified session asserts. */
    readonly roles: ReadonlyArray<string>
}
