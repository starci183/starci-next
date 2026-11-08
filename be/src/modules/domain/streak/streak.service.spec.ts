import { Test } from "@nestjs/testing"
import { FakeClock, fakeTransaction, mockEntityManager } from "@starci/jest-preset"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { StreakErrorCode } from "./errors/streak.error"
import type { ActionDayRow, StateRow } from "./persistence/streak.rows"
import { INSERT_ACTION, INSERT_STATE, LOCK_STATE, SELECT_ACTION_DAYS, UPDATE_STATE } from "./persistence/streak.sql"
import { STREAK_ACTION_KINDS, STREAK_SHARD_IDS, type StreakRules } from "./streak.contracts"
import { STREAK_OPTIONS } from "./streak.decorators"
import { StreakService } from "./streak.service"

const LEARNER = "20000000-0000-4000-8000-000000000001"
// 2026-11-11 (Wednesday) 10:00 in Ho Chi Minh City.
const NOW = new Date("2026-11-11T03:00:00.000Z")
const ZERO = { current: 0, longest: 0 }

const stateRow = (overrides: Partial<StateRow> = {}): StateRow => ({
    current_streak: 2,
    longest_streak: 4,
    last_closed_day: "2026-11-10",
    last_grant_week: "2026-11-09",
    weekly_goal: 4,
    freezes_held: 1,
    shard_counters: Object.fromEntries(STREAK_SHARD_IDS.map((shard) => [shard, ZERO])),
    freeze_days: [],
    badges: [],
    reminder: null,
    ...overrides,
})

const build = async (
    rows: { state?: StateRow; days?: ReadonlyArray<ActionDayRow>; inserted?: boolean } = {},
    rules: Partial<StreakRules> = {},
) => {
    const em = mockEntityManager({
        query: [
            [INSERT_STATE, []],
            [LOCK_STATE, [rows.state ?? stateRow()]],
            [SELECT_ACTION_DAYS, rows.days ?? []],
            [INSERT_ACTION, rows.inserted === false ? [] : [{ day: "2026-11-11" }]],
            [UPDATE_STATE, []],
        ],
    })
    fakeTransaction(em)
    const moduleRef = await Test.createTestingModule({
        providers: [
            StreakService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: STREAK_OPTIONS, useValue: { rules } },
        ],
    }).compile()
    return { service: moduleRef.get(StreakService), em }
}

/** The parameters of a recorded query call. */
const paramsOf = (call: ReadonlyArray<unknown>): Array<unknown> => (Array.isArray(call[1]) ? call[1] : [])

const saved = (em: ReturnType<typeof mockEntityManager>): Array<Array<unknown>> =>
    em.query.mock.calls.filter((call) => call[0] === UPDATE_STATE).map(paramsOf)

describe("StreakService recordStreakAction", () => {
    it("stores the action under its id for today and says it counted", async () => {
        const { service, em } = await build()

        const recorded = await service.recordStreakAction(LEARNER, "essentials", "graded-attempt", {
            actionId: "attempt-1",
            sourceRef: "lesson/x",
        })

        expect(recorded).toEqual({ counted: true, day: "2026-11-11" })
        expect(em.query).toHaveBeenCalledWith(INSERT_ACTION, [
            LEARNER,
            "attempt-1",
            "essentials",
            "graded-attempt",
            "lesson/x",
            "2026-11-11",
            NOW,
        ])
    })

    it("answers counted false for an action id it already has", async () => {
        const { service } = await build({ inserted: false })

        await expect(
            service.recordStreakAction(LEARNER, "review", "review-due-done", { actionId: "day-1" }),
        ).resolves.toEqual({ counted: false, day: "2026-11-11" })
    })

    it("leaves the id of every call without one to the database", async () => {
        const { service, em } = await build()

        await service.recordStreakAction(LEARNER, "projects", "project-run")
        await service.recordStreakAction(LEARNER, "projects", "project-run")

        const ids = em.query.mock.calls.filter((call) => call[0] === INSERT_ACTION).map((call) => paramsOf(call)[1])
        expect(ids).toEqual([null, null])
    })

    it("counts an action of a closed day for today and keeps one of the open days", async () => {
        const { service } = await build()

        const late = await service.recordStreakAction(LEARNER, "interview", "interview-submitted", {
            actionId: "a",
            at: new Date("2026-11-05T03:00:00.000Z"),
        })
        const open = await service.recordStreakAction(LEARNER, "interview", "interview-submitted", {
            actionId: "b",
            at: new Date("2026-11-11T01:00:00.000Z"),
        })
        const future = await service.recordStreakAction(LEARNER, "interview", "interview-submitted", {
            actionId: "c",
            at: new Date("2026-11-20T01:00:00.000Z"),
        })

        expect([late.day, open.day, future.day]).toEqual(["2026-11-11", "2026-11-11", "2026-11-11"])
    })

    it("refuses a shard or kind it does not count with STREAK_ACTION_UNKNOWN and stores nothing", async () => {
        const { service, em } = await build()

        await expect(service.recordStreakAction(LEARNER, "profile", "graded-attempt")).rejects.toMatchObject({
            code: StreakErrorCode.ActionUnknown,
        })
        await expect(service.recordStreakAction(LEARNER, "review", "page-view")).rejects.toMatchObject({
            code: StreakErrorCode.ActionUnknown,
        })
        expect(em.query).not.toHaveBeenCalled()
        expect(STREAK_ACTION_KINDS).not.toContain("page-view")
    })
})

describe("StreakService recordStreakAction badges", () => {
    it("grants the blazing-fox badge when today completes seven days", async () => {
        const { service, em } = await build({
            state: stateRow({ current_streak: 6, longest_streak: 6 }),
            days: [{ day: "2026-11-11", shards: ["essentials"] }],
        })

        await service.recordStreakAction(LEARNER, "essentials", "graded-attempt", { actionId: "x" })

        expect(saved(em)[0]?.[9]).toBe(JSON.stringify(["blazing-fox"]))
    })
})

describe("StreakService summary", () => {
    it("reads the streak with today counted and saves the state the days were closed into", async () => {
        const { service, em } = await build({ days: [{ day: "2026-11-11", shards: ["review"] }] })

        const summary = await service.summary(LEARNER)

        expect(summary).toMatchObject({ today: "2026-11-11", current: 3, longest: 4, todayCounted: true })
        expect(saved(em)).toHaveLength(1)
    })

    it("closes a missed day with a freeze when the state is behind", async () => {
        const { service } = await build({ state: stateRow({ last_closed_day: "2026-11-09" }), days: [] })

        const summary = await service.summary(LEARNER)

        expect(summary.freezes.held).toBe(0)
        expect(summary.current).toBe(2)
        expect(summary.days.find((day) => day.day === "2026-11-10")?.freezeUsed).toBe(true)
    })
})

describe("StreakService setGoal", () => {
    it("stores the goal and the reminder", async () => {
        const { service, em } = await build()

        const view = await service.setGoal(LEARNER, {
            activeDays: 5,
            reminder: { enabled: true, localTime: "20:30" },
        })

        expect(view).toEqual({ weeklyGoal: 5, reminder: { enabled: true, localTime: "20:30" } })
        expect(saved(em)[0]?.[5]).toBe(5)
    })

    it("keeps the reminder it has when none is given", async () => {
        const reminder = { enabled: false, localTime: "07:00" }
        const { service } = await build({ state: stateRow({ reminder }) })

        await expect(service.setGoal(LEARNER, { activeDays: 2 })).resolves.toEqual({ weeklyGoal: 2, reminder })
    })

    it.each([1, 8, 3.5, Number.NaN])("refuses %s days with STREAK_GOAL_INVALID", async (activeDays) => {
        const { service } = await build()

        await expect(service.setGoal(LEARNER, { activeDays })).rejects.toMatchObject({
            code: StreakErrorCode.GoalInvalid,
        })
    })

    it("refuses a reminder time that is not HH:MM", async () => {
        const { service } = await build()

        await expect(
            service.setGoal(LEARNER, { activeDays: 4, reminder: { enabled: true, localTime: "25:00" } }),
        ).rejects.toMatchObject({ code: StreakErrorCode.GoalInvalid })
    })
})

describe("StreakService rules", () => {
    it("takes the freeze limits the app passes", async () => {
        const { service } = await build(
            { state: stateRow({ last_closed_day: "2026-11-09", freezes_held: 0 }) },
            { maxFreezes: 0 },
        )

        const summary = await service.summary(LEARNER)

        expect(summary.current).toBe(0)
    })
})
