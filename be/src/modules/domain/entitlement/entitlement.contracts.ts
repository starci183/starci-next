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

/** The learner whose stored Premium end is queried. */
export interface PremiumUntilParams {
    /** The authenticated learner to look up. */
    readonly learnerId: string
}

/** The stored Premium end instant, or null when the learner has never held Premium. */
export type OptionalPremiumUntil = string | null

/** One verified paid term that still stands, as a rebuild replays it. */
export interface StandingGrant {
    /** The purchased Premium term. */
    readonly term: PremiumTerm
    /** The provider confirmation instant of the purchase. */
    readonly confirmedAt: Date
}

/** What a rebuild is given: the learner and every paid term that still stands, oldest confirmation first. */
export interface RebuildPremiumParams {
    /** The learner whose Premium end is rebuilt. */
    readonly learnerId: string
    /** The standing grants, in the order they were confirmed. */
    readonly grants: ReadonlyArray<StandingGrant>
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

/** What the development grant is given: the learner and the term, with no purchase behind it. */
export interface DevGrantParams {
    /** The learner who receives Premium. */
    readonly learnerId: string
    /** The term granted. */
    readonly term: PremiumTerm
}
