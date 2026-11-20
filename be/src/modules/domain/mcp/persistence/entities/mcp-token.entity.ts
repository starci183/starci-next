import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity("mcp_access_tokens")
/** One personal access token of a learner's AI client: its name and the digest of the secret, never the secret. */
export class McpTokenEntity {
    /** The token id. */
    @Column({ name: "token_id", type: "uuid" })
    tokenId!: string

    /** The learner the token acts for. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The name the learner gave it (for example "Claude"). */
    @Column({ name: "name", type: "text" })
    name!: string

    /** The SHA-256 digest of the secret. */
    @Column({ name: "token_digest", type: "varchar", length: 64 })
    tokenDigest!: string

    /** The last four characters of the secret, so the learner tells tokens apart. */
    @Column({ name: "hint", type: "varchar", length: 4 })
    hint!: string

    /** When it was created. */
    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date

    /** When a client last used it, or null. */
    @Column({ name: "last_used_at", type: "timestamptz", nullable: true })
    lastUsedAt!: Date | null

    /** When it was revoked, or null while it works. */
    @Column({ name: "revoked_at", type: "timestamptz", nullable: true })
    revokedAt!: Date | null

    /** The surrogate key; the former key is the unique `<table>_natural_key`. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string
}
