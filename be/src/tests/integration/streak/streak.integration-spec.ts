import { fakeIds } from "@starci/jest-preset"
import { SystemClockService } from "@modules/platform/clock"
import { storeStreakState, storedStreakActionsOf, streakModules, streaksOf } from "../../world/streak-world.options"
import { useTestWorld } from "../../world/use-test-world"

const DAY_MS = 86_400_000

/** The Vietnam calendar day (UTC+7) of an instant, YYYY-MM-DD. */
const streakDayOf = (at: Date): string => new Date(at.getTime() + 7 * 3_600_000).toISOString().slice(0, 10)

/** The day `count` days after a day. */
const addDays = (day: string, count: number): string =>
    new Date(Date.parse(`${day}T00:00:00Z`) + count * DAY_MS).toISOString().slice(0, 10)

/** The Monday of the week of a day. */
const weekStartOf = (day: string): string => addDays(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7))

const clock = new SystemClockService()

/** The Vietnam calendar day of now. */
const today = (): string => streakDayOf(clock.now())

/**
 * The streak capability (integration): the real service over the real primary database. It proves the producer port stores an
 * action once per action id, that only meaningful actions of known shards count, how missed days close with and without a freeze,
 * and the weekly goal.
 */
describe("the streak capability (integration)", () => {
    const world = useTestWorld({ modules: streakModules })
    const ids = fakeIds("57ea0001")

    it("counts an action once per action id and shows it in today, the week and the counter of its shard", async () => {
        const learner = ids.next()

        const first = await streaksOf(world).recordStreakAction(learner, "essentials", "graded-attempt", {
            actionId: "attempt-1",
        })
        const again = await streaksOf(world).recordStreakAction(learner, "essentials", "graded-attempt", {
            actionId: "attempt-1",
        })
        const summary = await streaksOf(world).summary(learner)

        expect(first).toEqual({ counted: true, day: today() })
        expect(again).toEqual({ counted: false, day: today() })
        expect(await storedStreakActionsOf(world.db.primary, learner)).toHaveLength(1)
        expect(summary).toMatchObject({ current: 1, longest: 1, todayCounted: true, todayShards: ["essentials"] })
        expect(summary.week.activeDays).toBe(1)
        expect(summary.shardCounters.find((entry) => entry.shard === "essentials")).toMatchObject({
            current: 1,
            activeDaysLast30: 1,
        })
        expect(summary.shardCounters.find((entry) => entry.shard === "review")).toMatchObject({ current: 0 })
    })

    it("shows nothing counted to a learner who only reads, and creates the default goal and freeze", async () => {
        const summary = await streaksOf(world).summary(ids.next())

        expect(summary).toMatchObject({
            current: 0,
            todayCounted: false,
            week: { activeDays: 0, goal: 4 },
            freezes: { held: 1 },
            badges: [],
            reminder: null,
        })
        expect(summary.days).toHaveLength(30)
    })

    it("refuses a shard or an action kind the streak does not count and stores nothing", async () => {
        const learner = ids.next()

        await expect(streaksOf(world).recordStreakAction(learner, "profile", "graded-attempt")).rejects.toMatchObject({
            code: "STREAK_ACTION_UNKNOWN",
        })
        await expect(streaksOf(world).recordStreakAction(learner, "review", "page-view")).rejects.toMatchObject({
            code: "STREAK_ACTION_UNKNOWN",
        })

        expect(await storedStreakActionsOf(world.db.primary, learner)).toEqual([])
    })
})

/** The closing of days, the badge and the weekly goal of the streak capability, over the real primary database. */
describe("the streak capability days and goal (integration)", () => {
    const world = useTestWorld({ modules: streakModules })
    const ids = fakeIds("57ea0002")

    it("spends the held freeze on the first missed day, resets on the second and keeps the longest", async () => {
        const learner = ids.next()
        await storeStreakState(world.db.primary, {
            learnerId: learner,
            current: 5,
            longest: 5,
            lastClosedDay: addDays(today(), -3),
            grantWeek: weekStartOf(today()),
            freezes: 1,
        })

        const summary = await streaksOf(world).summary(learner)

        expect(summary).toMatchObject({ current: 0, longest: 5, freezes: { held: 0 } })
        expect(summary.days.find((day) => day.day === addDays(today(), -2))?.freezeUsed).toBe(true)
        expect(summary.days.find((day) => day.day === addDays(today(), -1))?.freezeUsed).toBe(false)
    })

    it("grants the blazing-fox badge when today completes a streak of seven", async () => {
        const learner = ids.next()
        await storeStreakState(world.db.primary, {
            learnerId: learner,
            current: 6,
            longest: 6,
            lastClosedDay: addDays(today(), -1),
            grantWeek: weekStartOf(today()),
            freezes: 0,
        })

        await streaksOf(world).recordStreakAction(learner, "review", "review-due-done", { actionId: "day" })
        const summary = await streaksOf(world).summary(learner)

        expect(summary).toMatchObject({ current: 7, longest: 7, badges: ["blazing-fox"] })
    })

    it("stores the weekly goal and the reminder, and refuses a goal outside 2 to 7", async () => {
        const learner = ids.next()

        const changed = await streaksOf(world).setGoal(learner, {
            activeDays: 6,
            reminder: { enabled: true, localTime: "20:00" },
        })
        const summary = await streaksOf(world).summary(learner)

        expect(changed).toEqual({ weeklyGoal: 6, reminder: { enabled: true, localTime: "20:00" } })
        expect(summary).toMatchObject({ week: { goal: 6 }, reminder: { enabled: true, localTime: "20:00" } })
        await expect(streaksOf(world).setGoal(learner, { activeDays: 1 })).rejects.toMatchObject({
            code: "STREAK_GOAL_INVALID",
        })
        await expect(streaksOf(world).setGoal(learner, { activeDays: 8 })).rejects.toMatchObject({
            code: "STREAK_GOAL_INVALID",
        })
    })
})
