import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("purchases")
/** One Premium purchase attempt with its immutable plan and price snapshot. */
export class PurchaseEntity {
    /** The purchase's own identifier. */
    @PrimaryColumn({ name: "purchase_id", type: "uuid" })
    purchaseId!: string

    /** The learner who started the purchase. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The immutable plan snapshot (`monthly` or `yearly`). */
    @Column({ name: "plan", type: "text" })
    plan!: string

    /** The immutable VND price snapshot of the selected offer. */
    @Column({ name: "amount_vnd", type: "integer" })
    amountVnd!: number

    /** The currency of the price snapshot; always VND. */
    @Column({ name: "currency", type: "text" })
    currency!: string

    /** The rail the checkout runs on (`sepay` or `payos`). */
    @Column({ name: "rail", type: "text" })
    rail!: string

    /** The order or invoice reference the provider echoes back in its confirmation. */
    @Column({ name: "order_code", type: "text" })
    orderCode!: string

    /** The provider's own transaction or link reference, once the provider reports one. */
    @Column({ name: "provider_ref", type: "text", nullable: true })
    providerRef!: string | null

    /** The lifecycle state (`pending`, `paid`, `failed`, `canceled` or `expired`). */
    @Column({ name: "status", type: "text" })
    status!: string

    /** The instant the purchase was created. */
    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date

    /** The instant the purchase last changed. */
    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date

    /** The instant a still-pending purchase lapses to expired. */
    @Column({ name: "expires_at", type: "timestamptz" })
    expiresAt!: Date

    /** The instant a verified confirmation settled the purchase, when it has. */
    @Column({ name: "confirmed_at", type: "timestamptz", nullable: true })
    confirmedAt!: Date | null
}
