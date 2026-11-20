import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity("review_learner_decks")
/** A deck a learner added. */
export class ReviewLearnerDeckEntity {
    /** The learner. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The deck. */
    @Column({ name: "deck_id", type: "text" })
    deckId!: string

    /** False once the learner removed the deck. */
    @Column({ name: "active", type: "boolean" })
    active!: boolean

    /** When it was added. */
    @Column({ name: "added_at", type: "timestamptz" })
    addedAt!: Date

    /** The surrogate key; the former key is the unique `<table>_natural_key`. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string
}
