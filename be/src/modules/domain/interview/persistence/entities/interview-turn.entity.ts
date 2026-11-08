import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("interview_turns")
/** One turn of an interview: what the interviewer said or what the candidate answered, stored before anything else happens. */
export class InterviewTurnEntity {
    /** The turn id. */
    @PrimaryColumn({ name: "turn_id", type: "uuid" })
    turnId!: string

    /** The session. */
    @Column({ name: "session_id", type: "uuid" })
    sessionId!: string

    /** The order of the turn in the session. */
    @Column({ name: "seq", type: "integer" })
    seq!: number

    /** The position of the question the turn belongs to. */
    @Column({ name: "position", type: "integer" })
    position!: number

    /** `interviewer` or `candidate`. */
    @Column({ name: "role", type: "varchar", length: 12 })
    role!: string

    /** What the turn is. */
    @Column({ name: "kind", type: "varchar", length: 12 })
    kind!: string

    /** The text. */
    @Column({ name: "content", type: "text" })
    content!: string

    /** The revision of a candidate answer. */
    @Column({ name: "revision", type: "integer", nullable: true })
    revision!: number | null

    /** True when the model produced the turn. */
    @Column({ name: "by_ai", type: "boolean" })
    byAi!: boolean

    /** When the turn was stored. */
    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date
}
