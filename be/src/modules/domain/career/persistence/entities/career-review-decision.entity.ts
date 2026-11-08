import { Column, Entity, PrimaryColumn } from "typeorm"
import type { ActorRole, ExperienceState, ReviewAction } from "../../career.contracts"

@Entity("career_review_decisions")
/** One append-only row of an item's audit trail: who did what, from which state to which, with the snapshot of that moment. */
export class CareerReviewDecisionEntity {
    /** The decision id. */
    @PrimaryColumn({ name: "decision_id", type: "uuid" })
    decisionId!: string

    /** The item. */
    @Column({ name: "item_id", type: "uuid" })
    itemId!: string

    /** What was done. */
    @Column({ name: "action", type: "text" })
    action!: ReviewAction

    /** Who did it, or null for the system. */
    @Column({ name: "actor_id", type: "uuid", nullable: true })
    actorId!: string | null

    /** The role it was done with. */
    @Column({ name: "actor_role", type: "text" })
    actorRole!: ActorRole

    /** The state before, or null. */
    @Column({ name: "from_state", type: "text", nullable: true })
    fromState!: ExperienceState | null

    /** The state after. */
    @Column({ name: "to_state", type: "text" })
    toState!: ExperienceState

    /** The note, or null. */
    @Column({ name: "note", type: "text", nullable: true })
    note!: string | null

    /** The line, evidence references and assignee at that moment. */
    @Column({ name: "snapshot", type: "jsonb" })
    snapshot!: Record<string, unknown>

    /** When. */
    @Column({ name: "at", type: "timestamptz" })
    at!: Date
}
