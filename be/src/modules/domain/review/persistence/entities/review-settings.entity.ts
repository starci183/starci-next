import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("review_settings")
/** The daily item goal of a learner. */
export class ReviewSettingsEntity {
    /** The learner. */
    @PrimaryColumn({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The items a day, 5 to 50. */
    @Column({ name: "daily_goal", type: "integer" })
    dailyGoal!: number

    /** The day the learner was last told their cards are due. */
    @Column({ name: "due_notified_on", type: "date", nullable: true })
    dueNotifiedOn!: string | null

    /** When it changed. */
    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date
}
