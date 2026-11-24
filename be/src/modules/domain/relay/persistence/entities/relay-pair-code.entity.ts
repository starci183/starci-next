import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity("relay_pair_codes")
/** A six-digit pairing code the signed-in learner asked for on the web: stored by its digest, one use, ten minutes. */
export class RelayPairCodeEntity {
    /** The digest of the code. */
    @Column({ name: "code_digest", type: "varchar", length: 64 })
    codeDigest!: string

    /** The learner who asked for it. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** When it was issued. */
    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date

    /** When it lapses. */
    @Column({ name: "expires_at", type: "timestamptz" })
    expiresAt!: Date

    /** When a CLI claimed it, or null. */
    @Column({ name: "used_at", type: "timestamptz", nullable: true })
    usedAt!: Date | null

    /** The surrogate key; the former key is the unique `<table>_natural_key`. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string
}
