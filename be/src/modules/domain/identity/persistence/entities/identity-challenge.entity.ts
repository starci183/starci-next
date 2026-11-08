import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("identity_challenges")
/** One emailed-code challenge; consuming it is one conditional update. */
export class IdentityChallengeEntity {
    /** Only the digest of the raw challenge reference is stored. */
    @PrimaryColumn({ name: "challenge_digest", type: "varchar", length: 64 })
    challengeDigest!: string

    /** What the code completes: sign-in, sign-up or password-reset. */
    @Column({ name: "purpose", type: "varchar", length: 16 })
    purpose!: string

    /** The account email the code is sent to. */
    @Column({ name: "email", type: "text" })
    email!: string

    /** The language of the mail: vi or en. */
    @Column({ name: "locale", type: "varchar", length: 2 })
    locale!: string

    /** The keyed digest of the current code; the code itself is never stored. */
    @Column({ name: "code_digest", type: "varchar", length: 64 })
    codeDigest!: string

    /** Wrong codes still tolerated. */
    @Column({ name: "attempts_left", type: "integer" })
    attemptsLeft!: number

    /** False when no mail may be sent, as for an unknown email in a reset. */
    @Column({ name: "deliver", type: "boolean" })
    deliver!: boolean

    /** The AES-GCM sealed payload the right code releases. */
    @Column({ name: "payload", type: "text" })
    payload!: string

    /** The challenge accepts no code at or after this instant. */
    @Column({ name: "expires_at", type: "timestamptz" })
    expiresAt!: Date

    /** Non-null once a right code consumed the challenge. */
    @Column({ name: "consumed_at", type: "timestamptz", nullable: true })
    consumedAt!: Date | null
}
