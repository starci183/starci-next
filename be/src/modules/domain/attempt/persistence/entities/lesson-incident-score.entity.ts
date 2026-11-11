import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("lesson_incident_scores")
/** The best mutation score one learner reached in the incident of one lesson; the proved level of the lesson needs it. */
export class LessonIncidentScoreEntity {
    /** The learner. */
    @PrimaryColumn({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The lesson whose incident was run. */
    @PrimaryColumn({ name: "lesson_id", type: "text" })
    lessonId!: string

    /** The mutation score of the learner's tests, in percent, 0 to 100; a lower rerun never lowers it. */
    @Column({ name: "mutation_score", type: "smallint" })
    mutationScore!: number

    /** When the score last changed. */
    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date
}
