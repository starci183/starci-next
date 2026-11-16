import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("harness_contents")
/** One immutable version of a harness content item (build, guide, doc, probe, trap or doctor pack) and whether it is live. */
export class HarnessContentEntity {
    /** The kind. */
    @PrimaryColumn({ name: "kind", type: "text" })
    kind!: string

    /** The key inside the kind. */
    @PrimaryColumn({ name: "content_key", type: "text" })
    contentKey!: string

    /** The version: the content commit it was imported from. */
    @PrimaryColumn({ name: "version", type: "text" })
    version!: string

    /** The hash of every input file. */
    @Column({ name: "content_hash", type: "text" })
    contentHash!: string

    /** `published` for the live version, `superseded` for an older one. */
    @Column({ name: "status", type: "varchar", length: 16 })
    status!: string

    /** The position in its list. */
    @Column({ name: "sort_index", type: "integer" })
    sortIndex!: number

    /** The record without the pack files. */
    @Column({ name: "content", type: "jsonb" })
    content!: Record<string, unknown>

    /** The tarball of the files a learner pulls, or null. */
    @Column({ name: "pack", type: "bytea", nullable: true })
    pack!: Buffer | null

    /** The SHA-256 of the tarball, or null. */
    @Column({ name: "pack_sha256", type: "text", nullable: true })
    packSha256!: string | null

    /** When the version was imported. */
    @Column({ name: "imported_at", type: "timestamptz" })
    importedAt!: Date
}
