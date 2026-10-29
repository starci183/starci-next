import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("identity_sessions")
/** Durable current session authority shared by every API replica. */
export class IdentitySessionEntity {
    /** Only this digest, never the raw browser credential, is stored. */
    @PrimaryColumn({ name: "reference_digest", type: "varchar", length: 64 })
    referenceDigest!: string

    /** The verified provider issuer. */
    @Column({ name: "issuer", type: "text" })
    issuer!: string

    /** The verified stable provider subject. */
    @Column({ name: "subject", type: "text" })
    subject!: string

    /** Role assertions copied only after signature verification. */
    @Column({ name: "roles", type: "jsonb" })
    roles!: Array<string>

    /** The earlier local and provider expiry. */
    @Column({ name: "expires_at", type: "timestamptz" })
    expiresAt!: Date

    /** Non-null once local sign-out invalidates every copy of the reference. */
    @Column({ name: "revoked_at", type: "timestamptz", nullable: true })
    revokedAt!: Date | null
}
