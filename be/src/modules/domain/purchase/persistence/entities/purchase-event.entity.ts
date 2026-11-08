import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("purchase_events")
/**
 * One append-only audit event of a purchase, such as a late paid confirmation after cancellation, or of a verified provider
 * delivery the capability could not apply (which may name no persisted purchase).
 */
export class PurchaseEventEntity {
    /** The event's own identifier. */
    @PrimaryColumn({ name: "event_id", type: "uuid" })
    eventId!: string

    /** The purchase the event records; null only for a refused or voided delivery that names no persisted order. */
    @Column({ name: "purchase_id", type: "uuid", nullable: true })
    purchaseId!: string | null

    /**
     * The event kind (`paid`, `late-paid`, `canceled`, `expired`, `checkout-refused`, `confirmation-refused` or
     * `payment-voided`).
     */
    @Column({ name: "kind", type: "text" })
    kind!: string

    /** The rail the event belongs to. */
    @Column({ name: "rail", type: "text" })
    rail!: string

    /** The provider reference the event carries, when it has one. */
    @Column({ name: "provider_ref", type: "text", nullable: true })
    providerRef!: string | null

    /** The order code a refused or voided delivery reported. */
    @Column({ name: "order_code", type: "text", nullable: true })
    orderCode!: string | null

    /** The amount a refused or voided delivery reported. */
    @Column({ name: "amount_vnd", type: "integer", nullable: true })
    amountVnd!: number | null

    /** The currency a refused or voided delivery reported. */
    @Column({ name: "currency", type: "text", nullable: true })
    currency!: string | null

    /** Why a delivery was refused or voided (`ConfirmationRefusal`); null for every other kind. */
    @Column({ name: "reason", type: "text", nullable: true })
    reason!: string | null

    /** The instant the event was recorded. */
    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date
}
