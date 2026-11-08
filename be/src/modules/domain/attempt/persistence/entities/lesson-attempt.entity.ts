import { Column, Entity, PrimaryColumn } from "typeorm"
import type { AttemptAnswer, AttemptResult } from "../../attempt.contracts"

@Entity("lesson_attempts")
/** One answer of a learner to a lesson activity under a revision, with where its grading stands and its result. */
export class LessonAttemptEntity {
    /** The attempt id. */
    @PrimaryColumn({ name: "attempt_id", type: "uuid" })
    attemptId!: string

    /** The learner who answered. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The lesson. */
    @Column({ name: "lesson_id", type: "text" })
    lessonId!: string

    /** The lesson version the learner studies. */
    @Column({ name: "lesson_version", type: "text" })
    lessonVersion!: string

    /** The activity. */
    @Column({ name: "activity_id", type: "text" })
    activityId!: string

    /** The revision of the answer to the activity. */
    @Column({ name: "revision", type: "integer" })
    revision!: number

    /** What the activity asks: choice, simulation, explain or exercise. */
    @Column({ name: "kind", type: "varchar", length: 16 })
    kind!: string

    /** The phase of the activity. */
    @Column({ name: "phase", type: "varchar", length: 16 })
    phase!: string

    /** The locale of the text of the learner and of the feedback. */
    @Column({ name: "locale", type: "varchar", length: 8 })
    locale!: string

    /** Whether the activity is a diagnostic that does not count toward passing. */
    @Column({ name: "is_diagnostic", type: "boolean" })
    isDiagnostic!: boolean

    /** The normalized answer. */
    @Column({ name: "answer", type: "jsonb" })
    answer!: AttemptAnswer

    /** `saved`, `grading`, `graded` or `failed`. */
    @Column({ name: "status", type: "varchar", length: 16 })
    status!: string

    /** The grade once graded. */
    @Column({ name: "result", type: "jsonb", nullable: true })
    result!: AttemptResult | null

    /** The stable code of a failed grading. */
    @Column({ name: "failure_code", type: "varchar", length: 64, nullable: true })
    failureCode!: string | null

    /** When the answer was stored. */
    @Column({ name: "submitted_at", type: "timestamptz" })
    submittedAt!: Date

    /** When the attempt was graded. */
    @Column({ name: "graded_at", type: "timestamptz", nullable: true })
    gradedAt!: Date | null

    /** When the row last changed. */
    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date
}
