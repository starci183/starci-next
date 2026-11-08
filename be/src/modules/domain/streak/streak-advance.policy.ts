import {
    type StreakActionDays,
    type StreakCounter,
    type StreakRules,
    type StreakShard,
    type StreakState,
} from "./streak.contracts"
import { addDays, daysBetween, laterDay, weekStartOf } from "./streak-day.policy"

/** The most closed days one catch-up walks; a longer absence has used every freeze long before. */
const CATCH_UP_DAYS = 400

/** The most freeze days kept in the state. */
const FREEZE_DAYS_KEPT = 60

const ZERO: StreakCounter = { current: 0, longest: 0 }

/** One counter per shard, each from the function given the shard. */
export const countersOf = (counterOf: (shard: StreakShard) => StreakCounter): Record<StreakShard, StreakCounter> => ({
    essentials: counterOf("essentials"),
    review: counterOf("review"),
    practice: counterOf("practice"),
    projects: counterOf("projects"),
    incidents: counterOf("incidents"),
    interview: counterOf("interview"),
})

/** The state of a learner met for the first time today: nothing closed yet, this week's freezes granted. */
export const initialState = (today: string, rules: StreakRules): StreakState => ({
    current: 0,
    longest: 0,
    lastClosedDay: addDays(today, -1),
    lastGrantWeek: weekStartOf(today),
    weeklyGoal: rules.defaultWeeklyGoal,
    freezesHeld: Math.min(rules.maxFreezes, rules.weeklyFreezes),
    shardCounters: countersOf(() => ZERO),
    freezeDays: [],
    badges: [],
    reminder: null,
})

/** Counts the days of the seven that start at `weekStart` with any action. */
export const activeDaysOfWeek = (weekStart: string, days: StreakActionDays): number =>
    daysBetween(weekStart, addDays(weekStart, 6)).filter((day) => days.has(day)).length

/** Grants the freezes of a week the state has not seen yet, with the earned one when the week before met the goal. */
const grantWeek = (state: StreakState, week: string, days: StreakActionDays, rules: StreakRules): StreakState => {
    if (week <= state.lastGrantWeek) return state
    const before = addDays(week, -7)
    const earned =
        state.lastGrantWeek === before && activeDaysOfWeek(before, days) >= state.weeklyGoal ? rules.earnedFreezes : 0
    return {
        ...state,
        lastGrantWeek: week,
        freezesHeld: Math.min(rules.maxFreezes, state.freezesHeld + rules.weeklyFreezes + earned),
    }
}

const extend = (counter: StreakCounter): StreakCounter => ({
    current: counter.current + 1,
    longest: Math.max(counter.longest, counter.current + 1),
})

const lapse = (counter: StreakCounter): StreakCounter => ({ current: 0, longest: counter.longest })

/** Closes one day: a counted day extends, a missed day spends a held freeze or resets the current streak (the longest stays). */
const closeDay = (state: StreakState, day: string, days: StreakActionDays): StreakState => {
    const shards = days.get(day)
    const shardCounters = countersOf((shard) =>
        shards?.has(shard) === true ? extend(state.shardCounters[shard]) : lapse(state.shardCounters[shard]),
    )
    if (shards !== undefined)
        return {
            ...state,
            ...extend({ current: state.current, longest: state.longest }),
            lastClosedDay: day,
            shardCounters,
        }
    if (state.current > 0 && state.freezesHeld > 0)
        return {
            ...state,
            lastClosedDay: day,
            freezesHeld: state.freezesHeld - 1,
            freezeDays: [...state.freezeDays, day].slice(-FREEZE_DAYS_KEPT),
            shardCounters,
        }
    return { ...state, current: 0, lastClosedDay: day, shardCounters }
}

/**
 * Brings the state up to today: closes every day after the last closed one through yesterday and grants the freezes of every
 * week entered, today's included. Idempotent for one `today`. `days` must hold the actions of the week before the first day it closes.
 */
export const advanceState = (
    state: StreakState,
    days: StreakActionDays,
    today: string,
    rules: StreakRules,
): StreakState => {
    const yesterday = addDays(today, -1)
    const next = addDays(state.lastClosedDay, 1)
    const earliest = addDays(yesterday, -CATCH_UP_DAYS)
    const start = laterDay(next, earliest)
    const closed = daysBetween(start, yesterday).reduce(
        (current, day) => closeDay(grantWeek(current, weekStartOf(day), days, rules), day, days),
        state,
    )
    return grantWeek(closed, weekStartOf(today), days, rules)
}
