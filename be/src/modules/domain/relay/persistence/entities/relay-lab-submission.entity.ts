import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity("relay_lab_submissions")
/** One submission of a lab, graded on the learner's machine against the hidden tests; practice level, never proof. */
export class RelayLabSubmissionEntity {
    /** The learner. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The course. */
    @Column({ name: "course_id", type: "text" })
    courseId!: string

    /** The lesson. */
    @Column({ name: "lesson_id", type: "text" })
    lessonId!: string

    /** The random nonce the signed result must carry (64 hex). */
    @Column({ name: "nonce", type: "text" })
    nonce!: string

    /** The random order of the hidden test ids the run executes. */
    @Column({ name: "seed_order", type: "jsonb" })
    seedOrder!: Array<string>

    /** The learner's committed sha that was graded, or null. */
    @Column({ name: "commit_sha", type: "text", nullable: true })
    commitSha!: string | null

    /** queued, running, graded or rejected. */
    @Column({ name: "status", type: "text" })
    status!: string

    /** The hidden test results once graded. */
    @Column({ name: "tests", type: "jsonb", nullable: true })
    tests!: Array<Record<string, unknown>> | null

    /** True when graded and every hidden test passed. */
    @Column({ name: "passed", type: "boolean" })
    passed!: boolean

    /** The stable reason code of a rejection, or null. */
    @Column({ name: "reject_reason", type: "text", nullable: true })
    rejectReason!: string | null

    /** The hints the learner opened. */
    @Column({ name: "hints_opened", type: "integer" })
    hintsOpened!: number

    /** The time the learner spent, in milliseconds. */
    @Column({ name: "time_spent_ms", type: "integer" })
    timeSpentMs!: number

    /** The learner's design document, a list of paragraphs. */
    @Column({ name: "design_doc", type: "jsonb" })
    designDoc!: Array<string>

    /** The device the grade manifest went to. */
    @Column({ name: "device_id", type: "uuid" })
    deviceId!: string

    /** When it was submitted. */
    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date

    /** When it was graded or rejected. */
    @Column({ name: "graded_at", type: "timestamptz", nullable: true })
    gradedAt!: Date | null

    /** The surrogate key; it is the submission id. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string
}
