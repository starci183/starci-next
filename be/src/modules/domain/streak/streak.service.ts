import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { StreakError, StreakErrorCode } from "./errors/streak.error"
import type { ActionDayRow, StateRow } from "./persistence/streak.rows"
import { INSERT_ACTION, INSERT_STATE, LOCK_STATE, SELECT_ACTION_DAYS, UPDATE_STATE } from "./persistence/streak.sql"
import {
    STREAK_ACTION_KINDS,
    STREAK_BADGE_DAYS,
    STREAK_BLAZING_FOX,
    STREAK_SHARD_IDS,
    type StreakActionDays,
    type StreakActionRef,
    type StreakGoalChange,
    type StreakGoalView,
    type StreakRecorded,
    type StreakRules,
    type StreakShard,
    type StreakState,
    type StreakSummary,
} from "./streak.contracts"
import { InjectStreakOptions } from "./streak.decorators"
import { DEFAULT_STREAK_RULES, type StreakOptions } from "./streak.options"
import { advanceState, countersOf, initialState } from "./streak-advance.policy"
import { addDays, dayOf, earlierDay } from "./streak-day.policy"
import { viewOf } from "./streak-view.policy"

/** The most day rows one read loads. */
const DAY_ROWS_MAX = 500

/** How far back the actions are read beyond the open days: the week before the first closed day, for the earned freeze. */
const WEEK_BEFORE = 7

/** The window of days the screens show. */
const WINDOW_DAYS = 30

const REMINDER_TIME = /^([01]\d|2[0-3]):[0-5]\d$/u

/** What one transaction works on: the state brought up to today and the actions it was brought up with. */
interface Loaded {
    readonly state: StreakState
    readonly days: StreakActionDays
    readonly today: string
}

const stateOf = (row: StateRow): StreakState => ({
    current: row.current_streak,
    longest: row.longest_streak,
    lastClosedDay: row.last_closed_day,
    lastGrantWeek: row.last_grant_week,
    weeklyGoal: row.weekly_goal,
    freezesHeld: row.freezes_held,
    shardCounters: countersOf((shard) => row.shard_counters[shard] ?? { current: 0, longest: 0 }),
    freezeDays: row.freeze_days,
    badges: row.badges,
    reminder: row.reminder,
})

/** The shards of a stored row that the streak knows; any other is left out. */
const knownShardsOf = (shards: ReadonlyArray<string>): Array<StreakShard> =>
    STREAK_SHARD_IDS.filter((known) => shards.includes(known))

const daysOf = (rows: ReadonlyArray<ActionDayRow>): StreakActionDays =>
    new Map(rows.map((row) => [row.day, new Set(knownShardsOf(row.shards))]))

/** The shard ids as plain text, to look up a name that came from a caller. */
const SHARD_NAMES: ReadonlyArray<string> = STREAK_SHARD_IDS

/** The action kinds as plain text, to look up a name that came from a caller. */
const ACTION_KIND_NAMES: ReadonlyArray<string> = STREAK_ACTION_KINDS

@Injectable()
/**
 * The one streak of the whole app. A day counts only when a part stored a meaningful action that day (an item review
 * session completed, a graded attempt, a project run, an interview session submitted); page views never count. Days and
 * weeks are Asia/Ho_Chi_Minh, weeks start on Monday. Days close lazily on every read and record, so there is no clock job.
 * Nothing here ever creates or verifies an experience item.
 */
export class StreakService {
    private readonly rules: StreakRules

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectStreakOptions() options: StreakOptions,
    ) {
        this.rules = { ...DEFAULT_STREAK_RULES, ...options.rules }
    }

    /**
     * The producer port every learning part calls after it has stored a meaningful action:
     * `recordStreakAction(learnerId, shard, kind, { actionId, sourceRef, at })`. A repeat of the same `actionId` of a learner
     * counts once and answers `counted: false`; without an `actionId` every call is a new action. The shard and the kind must be
     * ones the streak knows, otherwise STREAK_ACTION_UNKNOWN. An action of a day already closed counts for today.
     */
    recordStreakAction(
        learnerId: string,
        shard: string,
        kind: string,
        ref: StreakActionRef = {},
    ): Promise<StreakRecorded> {
        if (!SHARD_NAMES.includes(shard) || !ACTION_KIND_NAMES.includes(kind))
            return Promise.reject(new StreakError({ code: StreakErrorCode.ActionUnknown }))
        const now = this.clock.now()
        return this.entityManager.transaction(async (manager) => {
            const loaded = await this.load(manager, learnerId, now)
            const wanted = ref.at === undefined ? loaded.today : dayOf(ref.at)
            const open = addDays(loaded.state.lastClosedDay, 1)
            const day = wanted < open || wanted > loaded.today ? loaded.today : wanted
            const stored: Array<{ day: string }> = await manager.query(INSERT_ACTION, [
                learnerId,
                ref.actionId ?? null,
                shard,
                kind,
                ref.sourceRef ?? null,
                day,
                now,
            ])
            const days = daysOf(await this.actionRows(manager, learnerId, loaded.state, loaded.today))
            const state = this.withBadges(loaded.state, days, loaded.today)
            await this.save(manager, learnerId, state, now)
            return { counted: stored.length > 0, day }
        })
    }

    /** The streak of a learner as the screens show it: counters, the last 30 days, the week, the freezes and the badges. */
    summary(learnerId: string): Promise<StreakSummary> {
        const now = this.clock.now()
        return this.entityManager.transaction(async (manager) => {
            const loaded = await this.load(manager, learnerId, now)
            const days = daysOf(await this.actionRows(manager, learnerId, loaded.state, loaded.today))
            const state = this.withBadges(loaded.state, days, loaded.today)
            await this.save(manager, learnerId, state, now)
            return viewOf(state, days, loaded.today)
        })
    }

    /** Sets the weekly goal (2 to 7 active days) and, when given, the reminder, which is stored and never acted on here. */
    setGoal(learnerId: string, change: StreakGoalChange): Promise<StreakGoalView> {
        const { activeDays, reminder } = change
        if (
            !Number.isInteger(activeDays) ||
            activeDays < 2 ||
            activeDays > 7 ||
            (reminder !== undefined && reminder !== null && !REMINDER_TIME.test(reminder.localTime))
        )
            return Promise.reject(new StreakError({ code: StreakErrorCode.GoalInvalid }))
        const now = this.clock.now()
        return this.entityManager.transaction(async (manager) => {
            const loaded = await this.load(manager, learnerId, now)
            const state: StreakState = {
                ...loaded.state,
                weeklyGoal: activeDays,
                reminder: reminder ?? loaded.state.reminder,
            }
            await this.save(manager, learnerId, state, now)
            return { weeklyGoal: state.weeklyGoal, reminder: state.reminder }
        })
    }

    /** Creates the state of a new learner, locks it, and brings it up to today. */
    private async load(manager: EntityManager, learnerId: string, now: Date): Promise<Loaded> {
        const today = dayOf(now)
        const fresh = initialState(today, this.rules)
        await manager.query(INSERT_STATE, [
            learnerId,
            fresh.lastClosedDay,
            fresh.lastGrantWeek,
            fresh.weeklyGoal,
            fresh.freezesHeld,
            JSON.stringify(fresh.shardCounters),
            now,
        ])
        const rows: Array<StateRow> = await manager.query(LOCK_STATE, [learnerId])
        const row = rows[0]
        const stored = row === undefined ? fresh : stateOf(row)
        const days = daysOf(await this.actionRows(manager, learnerId, stored, today))
        return { state: advanceState(stored, days, today, this.rules), days, today }
    }

    /** Reads the days with actions from the week before the first open day, and the 30-day window, through today. */
    private actionRows(
        manager: EntityManager,
        learnerId: string,
        state: StreakState,
        today: string,
    ): Promise<Array<ActionDayRow>> {
        const needed = addDays(state.lastClosedDay, 1 - WEEK_BEFORE)
        const window = addDays(today, 1 - WINDOW_DAYS)
        return manager.query(SELECT_ACTION_DAYS, [learnerId, earlierDay(needed, window), today, DAY_ROWS_MAX])
    }

    /** Grants the blazing-fox badge once the streak, today included, reaches seven days. */
    private withBadges(state: StreakState, days: StreakActionDays, today: string): StreakState {
        const current = state.current + (days.has(today) ? 1 : 0)
        return current >= STREAK_BADGE_DAYS && !state.badges.includes(STREAK_BLAZING_FOX)
            ? { ...state, badges: [...state.badges, STREAK_BLAZING_FOX] }
            : state
    }

    /** Writes the state. */
    private async save(manager: EntityManager, learnerId: string, state: StreakState, now: Date): Promise<void> {
        await manager.query(UPDATE_STATE, [
            learnerId,
            state.current,
            state.longest,
            state.lastClosedDay,
            state.lastGrantWeek,
            state.weeklyGoal,
            state.freezesHeld,
            JSON.stringify(state.shardCounters),
            JSON.stringify(state.freezeDays),
            JSON.stringify(state.badges),
            state.reminder === null ? null : JSON.stringify(state.reminder),
            now,
        ])
    }
}
