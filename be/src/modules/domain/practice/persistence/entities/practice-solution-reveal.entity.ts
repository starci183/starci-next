import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("practice_solution_reveals")
/** The first time a learner revealed the reference solution of a problem. */
export class PracticeSolutionRevealEntity {
    /** The learner. */
    @PrimaryColumn({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The problem. */
    @PrimaryColumn({ name: "problem_id", type: "text" })
    problemId!: string

    /** When the solution was first revealed. */
    @Column({ name: "revealed_at", type: "timestamptz" })
    revealedAt!: Date
}
