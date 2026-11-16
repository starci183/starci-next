import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("harness_build_bindings")
/** The agent project whose GitHub CI proves one build for one learner. */
export class HarnessBuildBindingEntity {
    /** The learner. */
    @PrimaryColumn({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The build. */
    @PrimaryColumn({ name: "build_id", type: "text" })
    buildId!: string

    /** The bound project. */
    @Column({ name: "project_id", type: "uuid" })
    projectId!: string

    /** When it was bound. */
    @Column({ name: "bound_at", type: "timestamptz" })
    boundAt!: Date
}
