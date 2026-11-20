import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity("practice_pattern_intros")
/** The paragraph that says when to use a pattern, in one locale. */
export class PracticePatternIntroEntity {
    /** The pattern. */
    @Column({ name: "pattern_id", type: "text" })
    patternId!: string

    /** The locale, `vi` or `en`. */
    @Column({ name: "locale", type: "varchar", length: 8 })
    locale!: string

    /** The paragraph. */
    @Column({ name: "intro", type: "text" })
    intro!: string

    /** When the paragraph was last imported. */
    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date

    /** The surrogate key; the former key is the unique `<table>_natural_key`. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string
}
