import { Test } from "@nestjs/testing"
import type { StreakActionDays, StreakShard } from "./streak.contracts"
import { DEFAULT_STREAK_RULES } from "./streak.options"
import { initialState } from "./streak-advance.policy"
import { viewOf } from "./streak-view.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { viewOf }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("streak.view-policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const daysOf = (entries: ReadonlyArray<readonly [string, ...Array<StreakShard>]>): StreakActionDays =>
    new Map(entries.map(([day, ...shards]) => [day, new Set<StreakShard>(shards)]))

// 2026-11-11 is a Wednesday.
describe("viewOf", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    const state = {
        ...initialState("2026-11-11", DEFAULT_STREAK_RULES),
        current: 3,
        longest: 5,
        freezeDays: ["2026-11-10"],
    }

    it("adds today to the streak once it counts, and never lowers the longest", () => {
        const view = subject.viewOf(state, daysOf([["2026-11-11", "review"]]), "2026-11-11")

        expect(view).toMatchObject({ current: 4, longest: 5, todayCounted: true, todayShards: ["review"] })
        expect(view.shardCounters.find((counter) => counter.shard === "review")).toEqual({
            shard: "review",
            current: 1,
            longest: 1,
            activeDaysLast30: 1,
        })
    })

    it("shows 30 days oldest first with the shards of each and the freeze days, and the week so far", () => {
        const view = subject.viewOf(
            state,
            daysOf([
                ["2026-11-09", "essentials"],
                ["2026-11-11", "review"],
            ]),
            "2026-11-11",
        )

        expect(view.days).toHaveLength(30)
        expect(view.days[0]?.day).toBe("2026-10-13")
        expect(view.days.at(-1)).toEqual({ day: "2026-11-11", counted: true, shards: ["review"], freezeUsed: false })
        expect(view.days.find((day) => day.day === "2026-11-10")).toMatchObject({ counted: false, freezeUsed: true })
        expect(view.week).toEqual({ activeDays: 2, goal: 4 })
        expect(view.freezes).toEqual({ held: 1 })
    })

    it("lets a streak that has not counted today show the closed days only", () => {
        const view = subject.viewOf(state, daysOf([]), "2026-11-11")

        expect(view).toMatchObject({ current: 3, todayCounted: false, todayShards: [] })
        expect(view.shardCounters).toHaveLength(6)
    })
})
