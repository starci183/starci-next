import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("entitlements")
/** The single Premium entitlement held for a learner. */
export class EntitlementEntity {
    /** The learner owning this entitlement. */
    @PrimaryColumn({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The UTC instant Premium access ends. */
    @Column({ name: "premium_until", type: "timestamptz" })
    premiumUntil!: Date

    /** When this entitlement was last changed. */
    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date
}
