/** The request of the CV link of the signed-in learner. */
export interface GetMyCvLinkRequest {
    /** The name of the account of the learner, from the verified session, or null. */
    readonly accountName: string | null
}
