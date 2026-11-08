import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("identity_social_bundles")
/** The one-use PKCE material of a social sign-in in flight. */
export class IdentitySocialBundleEntity {
    /** The one-way digest of the state sent to the provider. */
    @PrimaryColumn({ name: "state_digest", type: "varchar", length: 64 })
    stateDigest!: string

    /** The nonce the ID token must carry. */
    @Column({ name: "nonce", type: "varchar", length: 43 })
    nonce!: string

    /** The confidential verifier used only by the claim winner. */
    @Column({ name: "code_verifier", type: "varchar", length: 43 })
    codeVerifier!: string

    /** The validated same-origin path to return to. */
    @Column({ name: "return_to", type: "text" })
    returnTo!: string

    /** The bundle cannot be claimed at or after this instant. */
    @Column({ name: "expires_at", type: "timestamptz" })
    expiresAt!: Date

    /** Non-null once a callback claimed the bundle. */
    @Column({ name: "consumed_at", type: "timestamptz", nullable: true })
    consumedAt!: Date | null
}
