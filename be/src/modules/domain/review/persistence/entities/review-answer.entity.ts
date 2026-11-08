import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("review_answers")
/** The written answer of a learner to a retrieval item, stored before the sample answer shows. */
export class ReviewAnswerEntity {
    /** The learner. */
    @PrimaryColumn({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The item. */
    @PrimaryColumn({ name: "item_id", type: "text" })
    itemId!: string

    /** The revision. */
    @PrimaryColumn({ name: "revision", type: "integer" })
    revision!: number

    /** The answer. */
    @Column({ name: "answer_text", type: "text" })
    answerText!: string

    /** When it was stored. */
    @Column({ name: "submitted_at", type: "timestamptz" })
    submittedAt!: Date
}
