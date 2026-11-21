import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity("review_reviews")
/** One stored review of an item under a revision. */
export class ReviewReviewEntity {
    /** The learner. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The item. */
    @Column({ name: "item_id", type: "text" })
    itemId!: string

    /** The revision. */
    @Column({ name: "revision", type: "integer" })
    revision!: number

    /** again, hard, good or easy. */
    @Column({ name: "grade", type: "varchar", length: 8 })
    grade!: string

    /** Whether the cloze check was right, or null. */
    @Column({ name: "cloze_correct", type: "boolean", nullable: true })
    clozeCorrect!: boolean | null

    /** When it was stored. */
    @Column({ name: "answered_at", type: "timestamptz" })
    answeredAt!: Date

    /** The day (Asia/Ho_Chi_Minh). */
    @Column({ name: "answered_on", type: "date" })
    answeredOn!: string

    /** The surrogate key; the former key is the unique `<table>_natural_key`. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string
}
