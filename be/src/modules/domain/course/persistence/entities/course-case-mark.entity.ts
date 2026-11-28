import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm"

@Entity("course_case_marks")
@Unique("course_case_marks_natural_key", ["learnerId", "lessonId", "caseId"])
/** What one learner has done with one case: hints opened, whether it was ever green, whether its solution was opened and the last reset. */
export class CourseCaseMarkEntity {
    /** The learner. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The lesson. */
    @Column({ name: "lesson_id", type: "text" })
    lessonId!: string

    /** The case. */
    @Column({ name: "case_id", type: "text" })
    caseId!: string

    /** Hint levels opened, 0 to 3. */
    @Column({ name: "hints_opened", type: "integer" })
    hintsOpened!: number

    /** Whether the case was green at least once. */
    @Column({ name: "ever_green", type: "boolean" })
    everGreen!: boolean

    /** Whether the learner opened the case's solution ("Kẹt quá? Xem lời giải"); never goes back to false. */
    @Column({ name: "solution_opened", type: "boolean" })
    solutionOpened!: boolean

    /** When the learner last reset to the reference step, or null. */
    @Column({ name: "last_reset_at", type: "timestamptz", nullable: true })
    lastResetAt!: Date | null

    /** The branch the work was stashed under at the last reset, or null. */
    @Column({ name: "stashed_branch", type: "text", nullable: true })
    stashedBranch!: string | null

    /** When the row last changed. */
    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date

    /** The surrogate key; the former key is the unique `<table>_natural_key`. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string
}
