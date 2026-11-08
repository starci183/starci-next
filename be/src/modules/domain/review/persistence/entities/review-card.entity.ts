import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("review_cards")
/** One flashcard of a deck version: the public front and the hidden back. */
export class ReviewCardEntity {
    /** The item id, card:deck/n. */
    @PrimaryColumn({ name: "item_id", type: "text" })
    itemId!: string

    /** The deck version. */
    @PrimaryColumn({ name: "version", type: "text" })
    version!: string

    /** The deck. */
    @Column({ name: "deck_id", type: "text" })
    deckId!: string

    /** The position in the deck. */
    @Column({ name: "sort_index", type: "integer" })
    sortIndex!: number

    /** Whether the card needs Premium. */
    @Column({ name: "is_premium", type: "boolean" })
    isPremium!: boolean

    /** junior, middle, senior or staff. */
    @Column({ name: "level", type: "varchar", length: 16 })
    level!: string

    /** The code language, or null. */
    @Column({ name: "langs", type: "text", nullable: true })
    langs!: string | null

    /** The public front by locale: question and tags. */
    @Column({ name: "front", type: "jsonb" })
    front!: unknown

    /** The hidden back by locale: answer markdown and cloze terms. */
    @Column({ name: "back", type: "jsonb" })
    back!: unknown
}
