import type { EssentialPart } from "./entitlement.contracts"

/** Options of the entitlement capability. */
export interface EntitlementOptions {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
    /** Whether the development grant of Premium may run; absent, false, so production refuses it. */
    readonly devGrant?: boolean
    /**
     * The parts of an Essentials lesson that need no Premium (`1-essential`, `2-source`, `3-scenarios`, `4-apply`); absent, only
     * `1-essential`. Source, scenarios, challenges, `source.tgz`, relay runs and the AI tutor's reads follow their part.
     */
    readonly essentialFreeParts?: ReadonlyArray<EssentialPart>
}
