import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("agent_lab_usage")
/** The model calls one learner made through the capped proxy key on one UTC day. */
export class AgentLabUsageEntity {
    /** The learner. */
    @PrimaryColumn({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The UTC day, as a date. */
    @PrimaryColumn({ name: "usage_day", type: "date" })
    usageDay!: string

    /** The calls made that day. */
    @Column({ name: "calls", type: "integer" })
    calls!: number

    /** When the count last changed. */
    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date
}
