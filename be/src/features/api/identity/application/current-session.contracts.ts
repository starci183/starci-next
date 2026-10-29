/** Cookie credential for a durable session operation. */
export interface CurrentSessionRequest {
    /** Opaque host-only reference, absent for signed-out callers. */
    readonly reference: string | undefined
}
