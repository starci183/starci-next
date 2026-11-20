import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity("project_concepts")
/** Where a project shows one concept: the code location, the endpoint the probes aim at and the sample body they send. */
export class ProjectConceptEntity {
    /** The project. */
    @Column({ name: "project_id", type: "uuid" })
    projectId!: string

    /** The concept id (a Essentials lesson id). */
    @Column({ name: "concept_id", type: "text" })
    conceptId!: string

    /** The code location the learner points to, else null. */
    @Column({ name: "location", type: "text", nullable: true })
    location!: string | null

    /** The endpoint `METHOD /path` the probes aim at, else null. */
    @Column({ name: "endpoint", type: "text", nullable: true })
    endpoint!: string | null

    /** The JSON body the probes send, else null. */
    @Column({ name: "sample_body", type: "text", nullable: true })
    sampleBody!: string | null

    /** When it last changed. */
    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date

    /** The surrogate key; the former key is the unique `<table>_natural_key`. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string
}
