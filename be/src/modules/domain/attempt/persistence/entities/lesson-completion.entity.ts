import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("lesson_completions")
/** The instant one learner finished one lesson: every required activity graded. Written once; the reviews open from it. */
export class LessonCompletionEntity {
    /** The learner. */
    @PrimaryColumn({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The lesson. */
    @PrimaryColumn({ name: "lesson_id", type: "text" })
    lessonId!: string

    /** The version the learner finished. */
    @Column({ name: "lesson_version", type: "text" })
    lessonVersion!: string

    /** When the lesson was finished. */
    @Column({ name: "completed_at", type: "timestamptz" })
    completedAt!: Date
}
