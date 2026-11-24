import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm"

@Entity("course_case_runs")
@Unique("course_case_runs_natural_key", ["learnerId", "eventId"])
/** One run of one case uploaded from a learner's machine. */
export class CourseCaseRunEntity {
    /** The learner. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The lesson. */
    @Column({ name: "lesson_id", type: "text" })
    lessonId!: string

    /** The case. */
    @Column({ name: "case_id", type: "text" })
    caseId!: string

    /** happy or unhappy. */
    @Column({ name: "kind", type: "text" })
    kind!: string

    /** green, red or error. */
    @Column({ name: "status", type: "text" })
    status!: string

    /** When it ran on the machine. */
    @Column({ name: "ran_at", type: "timestamptz" })
    ranAt!: Date

    /** How long it took, in milliseconds. */
    @Column({ name: "duration_ms", type: "integer" })
    durationMs!: number

    /** The learner's commit it ran on. */
    @Column({ name: "learner_commit", type: "text" })
    learnerCommit!: string

    /** The chaos switches of the run. */
    @Column({ name: "chaos", type: "jsonb" })
    chaos!: Record<string, unknown>

    /** The cases run before it in the same call, with their outcomes. */
    @Column({ name: "up_to", type: "jsonb" })
    upTo!: Array<unknown>

    /** Why it failed, or null. */
    @Column({ name: "failed", type: "jsonb", nullable: true })
    failed!: Record<string, unknown> | null

    /** The client event id, so a resend changes nothing twice. */
    @Column({ name: "event_id", type: "uuid" })
    eventId!: string

    /** When the relay stored it. */
    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date

    /** The surrogate key; the former key is the unique `<table>_natural_key`. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string
}
