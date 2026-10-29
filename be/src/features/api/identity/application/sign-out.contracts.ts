/** Cookie credential for a durable session operation. */
export interface SignOutRequest {
    /** Opaque host-only reference, absent for signed-out callers. */
    readonly reference: string | undefined
}
