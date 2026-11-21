import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity("project_check_documents")
/** One document of the check set a seed standard carries: the catalog, a probe or a file of the learner kit, as the standard records it. */
export class ProjectCheckDocumentEntity {
    /** The set of the standard the document belongs to (`project-catalog`, `project-probes`, `project-kit`). */
    @Column({ name: "document_set", type: "text" })
    documentSet!: string

    /** The natural key inside the set: `catalog`, the probe id or the path under `kit/`. */
    @Column({ name: "document_key", type: "text" })
    documentKey!: string

    /** The record the standard carries, verbatim. */
    @Column({ name: "body", type: "jsonb" })
    body!: Record<string, unknown>

    /** When the standard last changed it. */
    @Column({ name: "imported_at", type: "timestamptz" })
    importedAt!: Date

    /** The surrogate key; the former key is the unique `<table>_natural_key`. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string
}
