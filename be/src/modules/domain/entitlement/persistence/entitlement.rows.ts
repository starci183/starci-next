import type { Entitlement } from "../entitlement.contracts"

/** The row returned by entitlement reads and grants. */
export interface EntitlementRow {
    /** Learner identity. */
    learner_id: string
    /** Entitlement end instant. */
    premium_until: Date
    /** Last update instant. */
    updated_at: Date
}

/** Maps a database row to the capability contract. */
export const toEntitlement = (row: EntitlementRow): Entitlement => ({
    learnerId: row.learner_id,
    premiumUntil: row.premium_until.toISOString(),
    updatedAt: row.updated_at.toISOString(),
})
