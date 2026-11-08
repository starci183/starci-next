import type { StreakReminder } from "@modules/domain/streak"

/** The weekly goal a learner sets. */
export interface SetStreakGoalRequest {
    /** The active days a week, 2 to 7. */
    readonly activeDays: number
    /** The reminder, when the learner sets one. */
    readonly reminder?: StreakReminder | null
}
