import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("review_decks")
/** One deck: its live version and what the picker shows. */
export class ReviewDeckEntity {
    /** The deck id, course folder and deck folder. */
    @PrimaryColumn({ name: "deck_id", type: "text" })
    deckId!: string

    /** The course folder. */
    @Column({ name: "course", type: "text" })
    course!: string

    /** The position in the course. */
    @Column({ name: "sort_index", type: "integer" })
    sortIndex!: number

    /** The live version label. */
    @Column({ name: "live_version", type: "text" })
    liveVersion!: string

    /** The difficulty the teacher wrote. */
    @Column({ name: "difficulty", type: "varchar", length: 16 })
    difficulty!: string

    /** The titles by locale. */
    @Column({ name: "titles", type: "jsonb" })
    titles!: unknown

    /** The descriptions by locale. */
    @Column({ name: "descriptions", type: "jsonb" })
    descriptions!: unknown

    /** The lesson modules the deck belongs to. */
    @Column({ name: "module_refs", type: "jsonb" })
    moduleRefs!: unknown

    /** The outcome tracks that use the deck. */
    @Column({ name: "tracks", type: "jsonb" })
    tracks!: unknown

    /** The cards of the live version. */
    @Column({ name: "card_count", type: "integer" })
    cardCount!: number

    /** The cards that are free. */
    @Column({ name: "free_card_count", type: "integer" })
    freeCardCount!: number

    /** When the live version was stored. */
    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date
}
