import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("harness_build_bindings")
/** The GitHub repository whose attested CI proves one build for one learner (no Project, no Premium). */
export class HarnessBuildBindingEntity {
    /** The learner. */
    @PrimaryColumn({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The build. */
    @PrimaryColumn({ name: "build_id", type: "text" })
    buildId!: string

    /** The id of the binding, which the workflow sends. */
    @Column({ name: "binding_id", type: "uuid" })
    bindingId!: string

    /** The GitHub repository, `owner/name`. */
    @Column({ name: "repository", type: "text" })
    repository!: string

    /** The GitHub id of the repository, known after the first attested run. */
    @Column({ name: "repository_id", type: "text", nullable: true })
    repositoryId!: string | null

    /** When it was bound. */
    @Column({ name: "bound_at", type: "timestamptz" })
    boundAt!: Date
}
