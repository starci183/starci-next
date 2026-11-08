import { Test } from "@nestjs/testing"
import type { StreakActionDays, StreakShard } from "./streak.contracts"
import { DEFAULT_STREAK_RULES } from "./streak.options"
import { activeDaysOfWeek, advanceState, initialState } from "./streak-advance.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { initialState, advanceState, activeDaysOfWeek }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("streak.advance-policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const RULES = DEFAULT_STREAK_RULES

/** Days with actions, each by the shards named (default essentials). */
const dayEntryOf = (entry: string | readonly [string, ...Array<StreakShard>]): [string, Set<StreakShard>] => {
    if (typeof entry === "string") return [entry, new Set<StreakShard>(["essentials"])]
    const [day, ...shards] = entry
    return [day, new Set<StreakShard>(shards)]
}

const daysOf = (...entries: ReadonlyArray<string | readonly [string, ...Array<StreakShard>]>): StreakActionDays =>
    new Map(entries.map(dayEntryOf))

// 2026-11-09 is a Monday.
describe("initialState", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("starts empty with yesterday closed, this week's freeze and the default goal of four days", () => {
        const state = subject.initialState("2026-11-11", RULES)

        expect(state).toMatchObject({
            current: 0,
            longest: 0,
            lastClosedDay: "2026-11-10",
            lastGrantWeek: "2026-11-09",
            weeklyGoal: 4,
            freezesHeld: 1,
            badges: [],
            reminder: null,
        })
        expect(state.shardCounters.review).toEqual({ current: 0, longest: 0 })
    })
})

describe("advanceState", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("counts each closed day with an action and keeps one counter per shard", () => {
        const start = { ...initialState("2026-11-09", RULES), lastClosedDay: "2026-11-08" }
        const days = daysOf(["2026-11-09", "essentials", "review"], ["2026-11-10", "essentials"])

        const state = subject.advanceState(start, days, "2026-11-11", RULES)

        expect(state).toMatchObject({ current: 2, longest: 2, lastClosedDay: "2026-11-10" })
        expect(state.shardCounters.essentials).toEqual({ current: 2, longest: 2 })
        expect(state.shardCounters.review).toEqual({ current: 0, longest: 1 })
    })

    it("spends a held freeze on a missed day and keeps the streak", () => {
        const start = { ...initialState("2026-11-09", RULES), lastClosedDay: "2026-11-08" }

        const state = subject.advanceState(start, daysOf("2026-11-09", "2026-11-11"), "2026-11-12", RULES)

        expect(state).toMatchObject({ current: 2, freezesHeld: 0, freezeDays: ["2026-11-10"] })
    })

    it("resets the current streak without a freeze and keeps the longest", () => {
        const start = { ...initialState("2026-11-09", RULES), lastClosedDay: "2026-11-08", freezesHeld: 0 }

        const state = subject.advanceState(start, daysOf("2026-11-09", "2026-11-10"), "2026-11-13", RULES)

        expect(state).toMatchObject({ current: 0, longest: 2, lastClosedDay: "2026-11-12" })
    })

    it("does not spend a freeze to protect a streak of zero", () => {
        const start = { ...initialState("2026-11-09", RULES), lastClosedDay: "2026-11-08" }

        const state = subject.advanceState(start, daysOf(), "2026-11-11", RULES)

        expect(state).toMatchObject({ current: 0, freezesHeld: 1, freezeDays: [] })
    })

    it("grants the Monday freeze and an earned one when the week before met the goal, up to two held", () => {
        const week = ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"]
        const start = { ...initialState("2026-11-02", RULES), lastClosedDay: "2026-11-01", freezesHeld: 0 }

        const state = subject.advanceState(start, daysOf(...week), "2026-11-09", RULES)

        expect(state.freezesHeld).toBe(2)
        expect(state.lastGrantWeek).toBe("2026-11-09")
        expect(state.longest).toBe(4)
    })

    it("grants only the weekly freeze when the week before missed the goal, and never holds more than two", () => {
        const start = { ...initialState("2026-11-02", RULES), lastClosedDay: "2026-11-01", freezesHeld: 2 }

        const state = subject.advanceState(start, daysOf(), "2026-11-09", RULES)

        expect(state.freezesHeld).toBe(2)
        const spent = subject.advanceState({ ...start, freezesHeld: 0 }, daysOf(), "2026-11-09", RULES)
        expect(spent.freezesHeld).toBe(1)
    })

    it("is idempotent for one day", () => {
        const start = { ...initialState("2026-11-09", RULES), lastClosedDay: "2026-11-08" }
        const days = daysOf("2026-11-09")
        const once = subject.advanceState(start, days, "2026-11-11", RULES)

        expect(subject.advanceState(once, days, "2026-11-11", RULES)).toEqual(once)
    })

    it("walks a bounded catch-up after a very long absence", () => {
        const start = { ...initialState("2025-01-01", RULES), current: 5, longest: 9 }

        const state = subject.advanceState(start, daysOf(), "2026-11-11", RULES)

        expect(state).toMatchObject({ current: 0, longest: 9, lastClosedDay: "2026-11-10" })
    })
})

describe("activeDaysOfWeek", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("counts the days of the seven that start at the Monday with an action", () => {
        expect(
            subject.activeDaysOfWeek("2026-11-02", daysOf("2026-11-01", "2026-11-02", "2026-11-08", "2026-11-09")),
        ).toBe(2)
    })
})
