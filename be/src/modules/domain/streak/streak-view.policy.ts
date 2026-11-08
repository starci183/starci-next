import {
    STREAK_SHARD_IDS,
    type StreakActionDays,
    type StreakDayView,
    type StreakShard,
    type StreakState,
    type StreakSummary,
} from "./streak.contracts"
import { activeDaysOfWeek } from "./streak-advance.policy"
import { addDays, daysBetween, weekStartOf } from "./streak-day.policy"

/** The days the summary shows. */
const WINDOW_DAYS = 30

/** The state brought up to today, with the actions of today and the window, as the screens read it. */
export const viewOf = (state: StreakState, days: StreakActionDays, today: string): StreakSummary => {
    const todayShards = [...(days.get(today) ?? [])]
    const todayCounted = days.has(today)
    const current = state.current + (todayCounted ? 1 : 0)
    const window = daysBetween(addDays(today, 1 - WINDOW_DAYS), today)
    const strip: Array<StreakDayView> = window.map((day) => ({
        day,
        counted: days.has(day),
        shards: STREAK_SHARD_IDS.filter((shard) => days.get(day)?.has(shard) === true),
        freezeUsed: state.freezeDays.includes(day),
    }))
    return {
        today,
        current,
        longest: Math.max(state.longest, current),
        todayCounted,
        todayShards,
        days: strip,
        week: { activeDays: activeDaysOfWeek(weekStartOf(today), days), goal: state.weeklyGoal },
        freezes: { held: state.freezesHeld },
        shardCounters: STREAK_SHARD_IDS.map((shard: StreakShard) => {
            const counter = state.shardCounters[shard]
            const today1 = days.get(today)?.has(shard) === true ? 1 : 0
            return {
                shard,
                current: counter.current + today1,
                longest: Math.max(counter.longest, counter.current + today1),
                activeDaysLast30: window.filter((day) => days.get(day)?.has(shard) === true).length,
            }
        }),
        badges: state.badges,
        reminder: state.reminder,
    }
}
