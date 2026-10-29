/** The Premium term selected by a verified purchase. */
export type PremiumTerm = "monthly" | "yearly"

/** An entitlement at a point in time. */
export interface Entitlement {
    /** The learner who owns Premium access. */
    readonly learnerId: string
    /** The UTC instant Premium access ends. */
    readonly premiumUntil: string
    /** The UTC instant this entitlement was last changed. */
    readonly updatedAt: string
}

/** Details the purchase capability passes after verifying a paid purchase. */
export interface GrantPremiumParams {
    /** The authenticated learner who purchased Premium. */
    readonly learnerId: string
    /** The purchased Premium term. */
    readonly term: PremiumTerm
    /** The provider confirmation instant, supplied by the verified purchase flow. */
    readonly confirmedAt: Date
}
