/** Options of the entitlement capability. */
export interface EntitlementOptions {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
    /** Whether the development grant of Premium may run; absent, false, so production refuses it. */
    readonly devGrant?: boolean
}
