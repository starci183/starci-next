import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("lesson_outcome_levels")
/** The levels one learner reached for one learning outcome of a lesson, raised by graded attempts and never lowered. */
export class LessonOutcomeLevelEntity {
    /** The learner. */
    @PrimaryColumn({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The lesson. */
    @PrimaryColumn({ name: "lesson_id", type: "text" })
    lessonId!: string

    /** The outcome id. */
    @PrimaryColumn({ name: "outcome_id", type: "text" })
    outcomeId!: string

    /** What the learner showed to understand, 0 to 2. */
    @Column({ name: "understood", type: "smallint" })
    understood!: number

    /** What the learner proved by applying it, 0 to 2. */
    @Column({ name: "proved", type: "smallint" })
    proved!: number

    /** When the levels last changed. */
    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date
}
