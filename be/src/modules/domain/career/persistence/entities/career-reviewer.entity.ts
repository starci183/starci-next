import { Column, Entity, PrimaryColumn } from "typeorm"
import type { ExperiencePart } from "../../career.contracts"

@Entity("career_reviewers")
/** One appointment of a reviewer by the teacher, with its scope; an ended appointment stays for the audit. */
export class CareerReviewerEntity {
    /** The appointment id. */
    @PrimaryColumn({ name: "appointment_id", type: "uuid" })
    appointmentId!: string

    /** The reviewer's provider subject. */
    @Column({ name: "reviewer_id", type: "uuid" })
    reviewerId!: string

    /** The parts the reviewer may sign. */
    @Column({ name: "parts", type: "jsonb" })
    parts!: Array<ExperiencePart>

    /** The most open items at once. */
    @Column({ name: "capacity", type: "integer" })
    capacity!: number

    /** The learners the reviewer must not review. */
    @Column({ name: "conflicts", type: "jsonb" })
    conflicts!: Array<string>

    /** The teacher who appointed. */
    @Column({ name: "appointed_by", type: "uuid" })
    appointedBy!: string

    /** When appointed. */
    @Column({ name: "appointed_at", type: "timestamptz" })
    appointedAt!: Date

    /** When ended, or null. */
    @Column({ name: "ended_at", type: "timestamptz", nullable: true })
    endedAt!: Date | null
}
