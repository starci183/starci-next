/** What revokes a verified item takes. */
export interface RevokeExperienceRequest {
    /** The item. */
    readonly itemId: string
    /** Why it is revoked. */
    readonly reason: string
    /** The roles the verified session asserts. */
    readonly roles: ReadonlyArray<string>
}
