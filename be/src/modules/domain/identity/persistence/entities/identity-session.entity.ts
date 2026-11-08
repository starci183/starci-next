import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("identity_sessions")
/** Durable current session authority shared by every API replica. */
export class IdentitySessionEntity {
    /** Only this digest, never the raw browser credential, is stored. */
    @PrimaryColumn({ name: "reference_digest", type: "varchar", length: 64 })
    referenceDigest!: string

    /** The verified stable provider subject. */
    @Column({ name: "subject", type: "text" })
    subject!: string

    /** Role assertions copied only after signature verification. */
    @Column({ name: "roles", type: "jsonb" })
    roles!: Array<string>

    /** The cleaned display name from the verified token (at most 120 characters); null when it carried none. */
    @Column({ name: "display_name", type: "text", nullable: true })
    displayName!: string | null

    /** The cleaned email from the verified token (at most 254 characters); null when it carried none. */
    @Column({ name: "email", type: "text", nullable: true })
    email!: string | null

    /** The provider refresh token, AES-GCM sealed. */
    @Column({ name: "refresh_ciphertext", type: "text" })
    refreshCiphertext!: string

    /** When the provider refresh token stops working. */
    @Column({ name: "refresh_expires_at", type: "timestamptz" })
    refreshExpiresAt!: Date

    /** The earlier of the refresh expiry and the local maximum. */
    @Column({ name: "expires_at", type: "timestamptz" })
    expiresAt!: Date

    /** When the session was created; the local maximum counts from here. */
    @Column({ name: "issued_at", type: "timestamptz" })
    issuedAt!: Date

    /** Non-null once local sign-out or a password reset invalidates every copy of the reference. */
    @Column({ name: "revoked_at", type: "timestamptz", nullable: true })
    revokedAt!: Date | null
}
