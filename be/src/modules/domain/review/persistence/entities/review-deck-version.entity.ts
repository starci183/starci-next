import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity("review_deck_versions")
/** One immutable version of a deck. */
export class ReviewDeckVersionEntity {
    /** The deck. */
    @Column({ name: "deck_id", type: "text" })
    deckId!: string

    /** The version: the source ref. */
    @Column({ name: "version", type: "text" })
    version!: string

    /** The SHA-256 over the path and hash of every source file. */
    @Column({ name: "content_hash", type: "text" })
    contentHash!: string

    /** The SHA-256 of every source file by path. */
    @Column({ name: "source_hashes", type: "jsonb" })
    sourceHashes!: unknown

    /** When it was stored. */
    @Column({ name: "imported_at", type: "timestamptz" })
    importedAt!: Date

    /** The surrogate key; the former key is the unique `<table>_natural_key`. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string
}
