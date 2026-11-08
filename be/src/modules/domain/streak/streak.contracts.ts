/** The ids of the six learning shards that count toward the one streak, in the order of the hub. */
export const STREAK_SHARD_IDS = ["essentials", "review", "practice", "projects", "incidents", "interview"] as const

/** A learning shard id. */
export type StreakShard = (typeof STREAK_SHARD_IDS)[number]

/** The kinds of meaningful action a day counts for; a page view is none of them. */
export const STREAK_ACTION_KINDS = ["review-due-done", "graded-attempt", "project-run", "interview-submitted"] as const

/** A meaningful action kind. */
export type StreakActionKind = (typeof STREAK_ACTION_KINDS)[number]

/** The badge granted at seven streak days; only its slug is stored. */
export const STREAK_BLAZING_FOX = "blazing-fox"

/** The streak length that earns the blazing-fox badge. */
export const STREAK_BADGE_DAYS = 7

/** The settings of the streak rules; every value has a default and the app may pass others to `StreakModule.register`. */
export interface StreakRules {
    /** The weekly goal of a learner who set none, in active days (2 to 7). */
    readonly defaultWeeklyGoal: number
    /** The freezes granted at the start of every week (Monday). */
    readonly weeklyFreezes: number
    /** The extra freezes earned at the start of a week when the week before met its goal. */
    readonly earnedFreezes: number
    /** The most freezes held at once. */
    readonly maxFreezes: number
}

/** What a part passes beside the shard and kind when it reports an action. */
export interface StreakActionRef {
    /** The stable id of the stored action in the part (an attempt id, a run id, a session id); a repeat of it counts once. */
    readonly actionId?: string
    /** Where the action lives in the part, for the record. */
    readonly sourceRef?: string
    /** When it happened; absent, now. A day already closed is never reopened: the action counts for today. */
    readonly at?: Date
}

/** What recording an action answers. */
export interface StreakRecorded {
    /** True when the action was stored now; false when the same action id was already stored. */
    readonly counted: boolean
    /** The day (Asia/Ho_Chi_Minh, YYYY-MM-DD) the action belongs to. */
    readonly day: string
}

/** The reminder a learner may set; it is stored only. */
export interface StreakReminder {
    /** Whether a reminder is wanted. */
    readonly enabled: boolean
    /** The local time of the reminder, HH:MM. */
    readonly localTime: string
}

/** One day of the strip. */
export interface StreakDayView {
    /** The day, YYYY-MM-DD. */
    readonly day: string
    /** Whether a meaningful action happened. */
    readonly counted: boolean
    /** The shards that had an action. */
    readonly shards: ReadonlyArray<StreakShard>
    /** Whether a freeze covered the day. */
    readonly freezeUsed: boolean
}

/** The counter of one shard. */
export interface StreakShardCounterView {
    /** The shard. */
    readonly shard: StreakShard
    /** The days in a row with an action of this shard. */
    readonly current: number
    /** The best run. */
    readonly longest: number
    /** The days with an action of this shard in the last 30. */
    readonly activeDaysLast30: number
}

/** The week so far. */
export interface StreakWeekView {
    /** The active days so far. */
    readonly activeDays: number
    /** The weekly goal. */
    readonly goal: number
}

/** The freezes of a learner. */
export interface StreakFreezesView {
    /** The freezes held. */
    readonly held: number
}

/** Everything the screens show of the streak of one learner. */
export interface StreakSummary {
    /** Today, YYYY-MM-DD. */
    readonly today: string
    /** The streak, today included once it counts. */
    readonly current: number
    /** The best streak; never decreases. */
    readonly longest: number
    /** Whether today already counts. */
    readonly todayCounted: boolean
    /** The shards that already had an action today. */
    readonly todayShards: ReadonlyArray<StreakShard>
    /** The last 30 days, oldest first. */
    readonly days: ReadonlyArray<StreakDayView>
    /** This week (from Monday): the active days so far and the goal. */
    readonly week: StreakWeekView
    /** The freezes held. */
    readonly freezes: StreakFreezesView
    /** One counter per shard, in hub order. */
    readonly shardCounters: ReadonlyArray<StreakShardCounterView>
    /** The badge slugs earned. */
    readonly badges: ReadonlyArray<string>
    /** The reminder, or null when none was set. */
    readonly reminder: StreakReminder | null
}

/** What changing the goal is given. */
export interface StreakGoalChange {
    /** The active days a week, 2 to 7. */
    readonly activeDays: number
    /** The reminder, when the learner sets one. */
    readonly reminder?: StreakReminder | null
}

/** What changing the goal answers. */
export interface StreakGoalView {
    /** The weekly goal now. */
    readonly weeklyGoal: number
    /** The reminder now, or null. */
    readonly reminder: StreakReminder | null
}

/** A run of streak days for one counter, kept in the state. */
export interface StreakCounter {
    /** Days in a row, up to the last closed day. */
    readonly current: number
    /** The best run. */
    readonly longest: number
}

/** The stored state of one learner: everything up to the last closed day. */
export interface StreakState {
    /** The streak up to the last closed day. */
    readonly current: number
    /** The best streak up to the last closed day. */
    readonly longest: number
    /** The last day whose result is in the state. */
    readonly lastClosedDay: string
    /** The Monday of the last week whose freezes were granted. */
    readonly lastGrantWeek: string
    /** The weekly goal. */
    readonly weeklyGoal: number
    /** The freezes held. */
    readonly freezesHeld: number
    /** One counter per shard. */
    readonly shardCounters: Readonly<Record<StreakShard, StreakCounter>>
    /** The most recent days a freeze covered. */
    readonly freezeDays: ReadonlyArray<string>
    /** The badge slugs earned. */
    readonly badges: ReadonlyArray<string>
    /** The reminder, or null. */
    readonly reminder: StreakReminder | null
}

/** The shards that had an action on each day. */
export type StreakActionDays = ReadonlyMap<string, ReadonlySet<StreakShard>>
