import type { StreakCounter, StreakReminder } from "../streak.contracts"

/** The stored state of one learner. */
export interface StateRow {
    /** The streak up to the last closed day. */
    current_streak: number
    /** The best streak. */
    longest_streak: number
    /** The last closed day, YYYY-MM-DD. */
    last_closed_day: string
    /** The Monday of the last granted week, YYYY-MM-DD. */
    last_grant_week: string
    /** The weekly goal. */
    weekly_goal: number
    /** The freezes held. */
    freezes_held: number
    /** The counter of each shard. */
    shard_counters: Record<string, StreakCounter>
    /** The days a freeze covered. */
    freeze_days: Array<string>
    /** The badge slugs. */
    badges: Array<string>
    /** The reminder or null. */
    reminder: StreakReminder | null
}

/** The shards that had an action on one day. */
export interface ActionDayRow {
    /** The day, YYYY-MM-DD. */
    day: string
    /** The shards with an action. */
    shards: Array<string>
}
