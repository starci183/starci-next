import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("identity_login_transactions")
/** Browser-bound one-use authorization state; deletion is its atomic claim. */
export class LoginTransactionEntity {
    /** The one-way digest of provider-returned state. */
    @PrimaryColumn({ name: "state_digest", type: "varchar", length: 64 })
    stateDigest!: string

    /** The separate browser credential digest. */
    @Column({ name: "binding_digest", type: "varchar", length: 64 })
    bindingDigest!: string

    /** The nonce to verify in the provider's signed response. */
    @Column({ name: "nonce", type: "varchar", length: 43 })
    nonce!: string

    /** The confidential verifier used only by the claim winner. */
    @Column({ name: "verifier", type: "varchar", length: 43 })
    verifier!: string

    /** State cannot be claimed at or after this instant. */
    @Column({ name: "expires_at", type: "timestamptz" })
    expiresAt!: Date
}
