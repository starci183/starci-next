import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("project_ci_runs")
/** One signed CI delivery, kept once per run id so a replay adds nothing. */
export class ProjectCiRunEntity {
    /** The project. */
    @PrimaryColumn({ name: "project_id", type: "uuid" })
    projectId!: string

    /** The CI run id. */
    @PrimaryColumn({ name: "run_id", type: "text" })
    runId!: string

    /** The commit the run tested. */
    @Column({ name: "commit_sha", type: "text" })
    commitSha!: string

    /** Whether the whole run passed. */
    @Column({ name: "passed", type: "boolean" })
    passed!: boolean

    /** `attested` when GitHub vouched for the run (OIDC), else `signed-only`, which counts as practice. */
    @Column({ name: "attestation", type: "varchar", length: 16, default: "signed-only" })
    attestation!: string

    /** When StarCi received it. */
    @Column({ name: "received_at", type: "timestamptz" })
    receivedAt!: Date
}
