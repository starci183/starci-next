import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("project_probe_runs")
/** One run of the StarCi probes against a deployed address, with each probe's result. */
export class ProjectProbeRunEntity {
    /** The run id. */
    @PrimaryColumn({ name: "run_id", type: "uuid" })
    runId!: string

    /** The project. */
    @Column({ name: "project_id", type: "uuid" })
    projectId!: string

    /** The address that was probed. */
    @Column({ name: "url", type: "text" })
    url!: string

    /** Whether every probe passed. */
    @Column({ name: "passed", type: "boolean" })
    passed!: boolean

    /** The result of each probe. */
    @Column({ name: "results", type: "jsonb" })
    results!: ReadonlyArray<Readonly<Record<string, unknown>>>

    /** When it ran. */
    @Column({ name: "at", type: "timestamptz" })
    at!: Date
}
