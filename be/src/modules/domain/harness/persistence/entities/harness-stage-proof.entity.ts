import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("harness_stage_proofs")
/** One e2e result of an attested CI run of a bound project: only attested results are stored here. */
export class HarnessStageProofEntity {
    /** The learner. */
    @PrimaryColumn({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The build. */
    @PrimaryColumn({ name: "build_id", type: "text" })
    buildId!: string

    /** The stage. */
    @PrimaryColumn({ name: "stage_id", type: "text" })
    stageId!: string

    /** The e2e test id. */
    @PrimaryColumn({ name: "e2e_id", type: "text" })
    e2eId!: string

    /** The CI run id. */
    @PrimaryColumn({ name: "run_id", type: "text" })
    runId!: string

    /** Whether it passed. */
    @Column({ name: "passed", type: "boolean" })
    passed!: boolean

    /** The commit it ran on. */
    @Column({ name: "commit_sha", type: "text", nullable: true })
    commitSha!: string | null

    /** The project that posted the run. */
    @Column({ name: "project_id", type: "uuid" })
    projectId!: string

    /** When it was recorded. */
    @Column({ name: "recorded_at", type: "timestamptz" })
    recordedAt!: Date
}
