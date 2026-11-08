import { Column, Entity, PrimaryColumn } from "typeorm"
import type { StreakCounter, StreakReminder } from "../../streak.contracts"

@Entity("streak_states")
/** The streak of one learner up to the last closed day: counters, freezes, goal, reminder and badges. */
export class StreakStateEntity {
    /** The learner. */
    @PrimaryColumn({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The streak up to the last closed day. */
    @Column({ name: "current_streak", type: "integer" })
    currentStreak!: number

    /** The best streak. */
    @Column({ name: "longest_streak", type: "integer" })
    longestStreak!: number

    /** The last closed day. */
    @Column({ name: "last_closed_day", type: "date" })
    lastClosedDay!: string

    /** The Monday of the last week whose freezes were granted. */
    @Column({ name: "last_grant_week", type: "date" })
    lastGrantWeek!: string

    /** The weekly goal in active days. */
    @Column({ name: "weekly_goal", type: "smallint" })
    weeklyGoal!: number

    /** The freezes held. */
    @Column({ name: "freezes_held", type: "smallint" })
    freezesHeld!: number

    /** The counter of each shard. */
    @Column({ name: "shard_counters", type: "jsonb" })
    shardCounters!: Record<string, StreakCounter>

    /** The most recent days a freeze covered. */
    @Column({ name: "freeze_days", type: "jsonb" })
    freezeDays!: Array<string>

    /** The badge slugs earned. */
    @Column({ name: "badges", type: "jsonb" })
    badges!: Array<string>

    /** The reminder, or null. */
    @Column({ name: "reminder", type: "jsonb", nullable: true })
    reminder!: StreakReminder | null

    /** When the state last changed. */
    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date
}
