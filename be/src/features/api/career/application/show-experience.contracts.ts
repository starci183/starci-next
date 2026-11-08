/** What shows or hides a verified item of the signed-in learner on the public profile takes. */
export interface ShowExperienceRequest {
    /** The item. */
    readonly itemId: string
    /** Whether it shows on the public profile. */
    readonly shownPublicly: boolean
}
