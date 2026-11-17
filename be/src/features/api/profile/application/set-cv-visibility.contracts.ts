/** What makes the CV public or private takes. */
export interface SetCvVisibilityRequest {
    /** Whether anyone with the link can open the CV. */
    readonly isPublic: boolean
    /** The name of the learner's account from the verified session, or null. */
    readonly accountName: string | null
}
