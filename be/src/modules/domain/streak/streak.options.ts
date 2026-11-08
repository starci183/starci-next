import type { StreakRules } from "./streak.contracts"

/** The weekly goal of a learner who set none (Q-HUB-3). */
export const STREAK_DEFAULT_WEEKLY_GOAL = 4

/** The freezes granted every Monday (Q-HUB-2). */
export const STREAK_WEEKLY_FREEZES = 1

/** The extra freezes earned by meeting the goal of the week before (Q-HUB-2). */
export const STREAK_EARNED_FREEZES = 1

/** The most freezes held at once (Q-HUB-2). */
export const STREAK_MAX_FREEZES = 2

/** The rules the streak runs with unless the app names others. */
export const DEFAULT_STREAK_RULES: StreakRules = {
    defaultWeeklyGoal: STREAK_DEFAULT_WEEKLY_GOAL,
    weeklyFreezes: STREAK_WEEKLY_FREEZES,
    earnedFreezes: STREAK_EARNED_FREEZES,
    maxFreezes: STREAK_MAX_FREEZES,
}

/** Options of the streak capability. */
export interface StreakOptions {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
    /** Overrides of the rules; absent values take the defaults. */
    readonly rules?: Partial<StreakRules>
}
