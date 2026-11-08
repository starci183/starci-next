import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("review_states")
/** The schedule of one learner for one item. */
export class ReviewStateEntity {
    /** The learner. */
    @PrimaryColumn({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The item. */
    @PrimaryColumn({ name: "item_id", type: "text" })
    itemId!: string

    /** flashcard or retrieval. */
    @Column({ name: "source", type: "varchar", length: 16 })
    source!: string

    /** new, learning, review, done or suspended. */
    @Column({ name: "status", type: "varchar", length: 16 })
    status!: string

    /** The ladder step, -1 before the first review. */
    @Column({ name: "step", type: "smallint" })
    step!: number

    /** The due day (Asia/Ho_Chi_Minh). */
    @Column({ name: "due_on", type: "date" })
    dueOn!: string

    /** deck, lesson or track. */
    @Column({ name: "added_by", type: "varchar", length: 16 })
    addedBy!: string

    /** The deck of a card. */
    @Column({ name: "deck_id", type: "text", nullable: true })
    deckId!: string | null

    /** The lesson of a retrieval item. */
    @Column({ name: "lesson_id", type: "text", nullable: true })
    lessonId!: string | null

    /** The retrieval activity. */
    @Column({ name: "activity_id", type: "text", nullable: true })
    activityId!: string | null

    /** The lesson version the learner studied. */
    @Column({ name: "lesson_version", type: "text", nullable: true })
    lessonVersion!: string | null

    /** The authored days after completion. */
    @Column({ name: "after_days", type: "integer", nullable: true })
    afterDays!: number | null

    /** The status before the deck was removed. */
    @Column({ name: "suspended_from", type: "varchar", length: 16, nullable: true })
    suspendedFrom!: string | null

    /** The newest stored revision. */
    @Column({ name: "last_revision", type: "integer" })
    lastRevision!: number

    /** The revision whose answer was revealed. */
    @Column({ name: "flipped_revision", type: "integer" })
    flippedRevision!: number

    /** When the item joined the learner. */
    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date

    /** When the state last changed. */
    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date
}
