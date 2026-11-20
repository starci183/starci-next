import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity("practice_hint_reveals")
/** One step of the hint ladder a learner opened on a problem. */
export class PracticeHintRevealEntity {
    /** The learner. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The problem. */
    @Column({ name: "problem_id", type: "text" })
    problemId!: string

    /** The step, 1 to 3. */
    @Column({ name: "step", type: "smallint" })
    step!: number

    /** When the step was opened. */
    @Column({ name: "revealed_at", type: "timestamptz" })
    revealedAt!: Date

    /** The surrogate key; the former key is the unique `<table>_natural_key`. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string
}
