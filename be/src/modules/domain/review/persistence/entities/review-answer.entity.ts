import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity("review_answers")
/** The written answer of a learner to a retrieval item, stored before the sample answer shows. */
export class ReviewAnswerEntity {
    /** The learner. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The item. */
    @Column({ name: "item_id", type: "text" })
    itemId!: string

    /** The revision. */
    @Column({ name: "revision", type: "integer" })
    revision!: number

    /** The answer. */
    @Column({ name: "answer_text", type: "text" })
    answerText!: string

    /** When it was stored. */
    @Column({ name: "submitted_at", type: "timestamptz" })
    submittedAt!: Date

    /** The surrogate key; the former key is the unique `<table>_natural_key`. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string
}
