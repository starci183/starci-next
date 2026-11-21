import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity("project_proofs")
/** A subject (a concept, a milestone or the deployment) proved once, so its experience item, notification and streak fire once. */
export class ProjectProofEntity {
    /** The project. */
    @Column({ name: "project_id", type: "uuid" })
    projectId!: string

    /** `concept:<id>`, `milestone:<id>` or `deployed`. */
    @Column({ name: "subject", type: "text" })
    subject!: string

    /** When it was first proved. */
    @Column({ name: "proved_at", type: "timestamptz" })
    provedAt!: Date

    /** The surrogate key; the former key is the unique `<table>_natural_key`. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string
}
