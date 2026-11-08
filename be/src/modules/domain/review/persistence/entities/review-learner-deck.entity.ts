import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("review_learner_decks")
/** A deck a learner added. */
export class ReviewLearnerDeckEntity {
    /** The learner. */
    @PrimaryColumn({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The deck. */
    @PrimaryColumn({ name: "deck_id", type: "text" })
    deckId!: string

    /** False once the learner removed the deck. */
    @Column({ name: "active", type: "boolean" })
    active!: boolean

    /** When it was added. */
    @Column({ name: "added_at", type: "timestamptz" })
    addedAt!: Date
}
