import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("practice_hint_reveals")
/** One step of the hint ladder a learner opened on a problem. */
export class PracticeHintRevealEntity {
    /** The learner. */
    @PrimaryColumn({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The problem. */
    @PrimaryColumn({ name: "problem_id", type: "text" })
    problemId!: string

    /** The step, 1 to 3. */
    @PrimaryColumn({ name: "step", type: "smallint" })
    step!: number

    /** When the step was opened. */
    @Column({ name: "revealed_at", type: "timestamptz" })
    revealedAt!: Date
}
