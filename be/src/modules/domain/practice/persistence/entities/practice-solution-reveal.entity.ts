import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity("practice_solution_reveals")
/** The first time a learner revealed the reference solution of a problem. */
export class PracticeSolutionRevealEntity {
    /** The learner. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The problem. */
    @Column({ name: "problem_id", type: "text" })
    problemId!: string

    /** When the solution was first revealed. */
    @Column({ name: "revealed_at", type: "timestamptz" })
    revealedAt!: Date

    /** The surrogate key; the former key is the unique `<table>_natural_key`. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string
}
