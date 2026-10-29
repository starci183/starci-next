import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("purchase_events")
/** One append-only audit event of a purchase, such as a late paid confirmation after cancellation. */
export class PurchaseEventEntity {
    /** The event's own identifier. */
    @PrimaryColumn({ name: "event_id", type: "uuid" })
    eventId!: string

    /** The purchase the event records. */
    @Column({ name: "purchase_id", type: "uuid" })
    purchaseId!: string

    /** The event kind (`paid`, `late-paid`, `canceled`, `expired`, `checkout-refused` or `confirmation-refused`). */
    @Column({ name: "kind", type: "text" })
    kind!: string

    /** The rail the event belongs to. */
    @Column({ name: "rail", type: "text" })
    rail!: string

    /** The provider reference the event carries, when it has one. */
    @Column({ name: "provider_ref", type: "text", nullable: true })
    providerRef!: string | null

    /** The instant the event was recorded. */
    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date
}
