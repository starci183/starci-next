/** What reassigns a pending item takes. */
export interface AssignExperienceRequest {
    /** The item. */
    readonly itemId: string
    /** The reviewer, or null for the teacher's queue. */
    readonly reviewerId: string | null
    /** The roles the verified session asserts. */
    readonly roles: ReadonlyArray<string>
}
