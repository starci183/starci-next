import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity("streak_actions")
/** One meaningful action of a learner in a shard, stored once per learner and action id. */
export class StreakActionEntity {
    /** The learner. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The stable id the part gave the action. */
    @Column({ name: "action_id", type: "text" })
    actionId!: string

    /** The learning shard. */
    @Column({ name: "shard", type: "text" })
    shard!: string

    /** The action kind. */
    @Column({ name: "kind", type: "text" })
    kind!: string

    /** Where the action lives in the part. */
    @Column({ name: "source_ref", type: "text", nullable: true })
    sourceRef!: string | null

    /** The day (Asia/Ho_Chi_Minh) the action counts for. */
    @Column({ name: "day", type: "date" })
    day!: string

    /** When the action was stored. */
    @Column({ name: "recorded_at", type: "timestamptz" })
    recordedAt!: Date

    /** The surrogate key; the former key is the unique `<table>_natural_key`. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string
}
