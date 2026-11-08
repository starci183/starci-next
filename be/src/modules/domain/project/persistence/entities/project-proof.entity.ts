import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("project_proofs")
/** A subject (a concept, a milestone or the deployment) proved once, so its experience item, notification and streak fire once. */
export class ProjectProofEntity {
    /** The project. */
    @PrimaryColumn({ name: "project_id", type: "uuid" })
    projectId!: string

    /** `concept:<id>`, `milestone:<id>` or `deployed`. */
    @PrimaryColumn({ name: "subject", type: "text" })
    subject!: string

    /** When it was first proved. */
    @Column({ name: "proved_at", type: "timestamptz" })
    provedAt!: Date
}
