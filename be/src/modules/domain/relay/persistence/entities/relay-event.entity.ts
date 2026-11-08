import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("relay_events")
/** One practice event a paired device uploaded; stored once per device and client event id, never proof. */
export class RelayEventEntity {
    /** The device that uploaded it. */
    @PrimaryColumn({ name: "device_id", type: "uuid" })
    deviceId!: string

    /** The client event id the CLI chose. */
    @PrimaryColumn({ name: "event_id", type: "uuid" })
    eventId!: string

    /** The learner the device belongs to. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** check.started, check.result, log or manifest.ack. */
    @Column({ name: "kind", type: "text" })
    kind!: string

    /** The task the manifest named (a project id). */
    @Column({ name: "task_id", type: "text" })
    taskId!: string

    /** The run of the manifest's checks the event belongs to. */
    @Column({ name: "run_id", type: "text" })
    runId!: string

    /** The check of the manifest, or null for an ack. */
    @Column({ name: "check_id", type: "text", nullable: true })
    checkId!: string | null

    /** The concept the check proves in practice, or null. */
    @Column({ name: "concept_id", type: "text", nullable: true })
    conceptId!: string | null

    /** test, e2e or probe, or null. */
    @Column({ name: "slot", type: "text", nullable: true })
    slot!: string | null

    /** The test name, e2e file or probe id, or null. */
    @Column({ name: "ref", type: "text", nullable: true })
    ref!: string | null

    /** Whether the check passed, for a result. */
    @Column({ name: "passed", type: "boolean", nullable: true })
    passed!: boolean | null

    /** The exit code of a result. */
    @Column({ name: "exit_code", type: "integer", nullable: true })
    exitCode!: number | null

    /** How long the check ran, for a result. */
    @Column({ name: "duration_ms", type: "integer", nullable: true })
    durationMs!: number | null

    /** The commit it ran on, or null. */
    @Column({ name: "commit_sha", type: "text", nullable: true })
    commitSha!: string | null

    /** The size-capped log text, or the manifest id an ack names. */
    @Column({ name: "body", type: "text", nullable: true })
    body!: string | null

    /** When the relay stored it. */
    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date
}
