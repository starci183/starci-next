import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("lesson_hint_uses")
/** One scenario hint a learner asked for: the lesson then reads "có hỗ trợ". Written once per learner, lesson and scenario. */
export class LessonHintUseEntity {
    /** The learner. */
    @PrimaryColumn({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The lesson. */
    @PrimaryColumn({ name: "lesson_id", type: "text" })
    lessonId!: string

    /** The scenario whose hint was shown. */
    @PrimaryColumn({ name: "scenario_id", type: "text" })
    scenarioId!: string

    /** When the hint was first asked for. */
    @Column({ name: "used_at", type: "timestamptz" })
    usedAt!: Date
}
