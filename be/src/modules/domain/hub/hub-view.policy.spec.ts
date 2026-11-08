import { Test } from "@nestjs/testing"
import { STREAK_SHARD_IDS, type StreakSummary } from "@modules/domain/streak"
import type { HubSources } from "./hub.contracts"
import { type HubText } from "./hub-view.policy"
import { buildHub } from "./hub-view.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { buildHub }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("hub.view-policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

/** Answers the key with its params, so a spec asserts on keys, never on translated copy. */
const text: HubText = (key, params) => (params === undefined ? key : `${key}:${JSON.stringify(params)}`)

const streakOf = (overrides: Partial<StreakSummary> = {}): StreakSummary => ({
    today: "2026-11-11",
    current: 3,
    longest: 5,
    todayCounted: false,
    todayShards: [],
    days: Array.from({ length: 30 }, (_value, index) => ({
        day: `d${index}`,
        counted: false,
        shards: [],
        freezeUsed: false,
    })),
    week: { activeDays: 1, goal: 4 },
    freezes: { held: 1 },
    shardCounters: STREAK_SHARD_IDS.map((shard) => ({ shard, current: 1, longest: 2, activeDaysLast30: 3 })),
    badges: [],
    reminder: null,
    ...overrides,
})

const sourcesOf = (overrides: Partial<HubSources> = {}): HubSources => ({
    streak: streakOf(),
    review: { due: 4, doneToday: 0, goalDaily: 10 },
    essentials: { started: 2, total: 7 },
    experience: null,
    ...overrides,
})

describe("buildHub", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("lists the six shards in hub order with the progress of essentials and review and the counters of the streak", () => {
        const hub = subject.buildHub(sourcesOf(), text)

        expect(hub.shards.map((shard) => [shard.order, shard.shard, shard.label])).toEqual([
            [1, "essentials", "shards.essentials"],
            [2, "review", "shards.review"],
            [3, "practice", "shards.practice"],
            [4, "projects", "shards.projects"],
            [5, "incidents", "shards.incidents"],
            [6, "interview", "shards.interview"],
        ])
        expect(hub.shards[0]?.progress).toEqual({
            label: 'progress.essentials:{"started":2,"total":7}',
            value: 2,
            total: 7,
        })
        expect(hub.shards[1]?.progress).toEqual({ label: 'progress.reviewDue:{"due":4}', value: 4, total: null })
        expect(hub.shards[2]?.progress).toEqual({ label: "progress.idle", value: null, total: null })
        expect(hub.shards[0]?.counter).toEqual({ current: 1, longest: 2 })
        expect(hub.shards.every((shard) => shard.experience === null && !shard.unavailable)).toBe(true)
    })

    it("names the review line for no due items and puts the layer names behind their keys", () => {
        const hub = subject.buildHub(sourcesOf({ review: { due: 0, doneToday: 3, goalDaily: 10 } }), text)

        expect(hub.shards[1]?.progress.label).toBe("progress.reviewNone")
        expect(hub.layers.map((layer) => layer.label)).toEqual(["layers.mission", "layers.profile", "layers.hiring"])
        expect(hub.today[0]?.title).toBe("today.essentials")
    })

    it("lists review first then one prompt per shard while today does not count, each linked", () => {
        const hub = subject.buildHub(sourcesOf(), text)

        expect(hub.today.map((item) => [item.shard, item.link])).toEqual([
            ["review", "/review/session"],
            ["essentials", "/essentials"],
            ["practice", "/practice"],
            ["projects", "/projects"],
            ["incidents", "/incidents"],
            ["interview", "/interview"],
        ])
        expect(hub.today[0]?.title).toBe('today.review:{"due":4}')
    })

    it("keeps only the due review items once today counts, and nothing when none is due", () => {
        const counted = streakOf({ todayCounted: true, todayShards: ["essentials"] })

        expect(subject.buildHub(sourcesOf({ streak: counted }), text).today.map((item) => item.shard)).toEqual([
            "review",
        ])
        expect(
            subject.buildHub(sourcesOf({ streak: counted, review: { due: 0, doneToday: 3, goalDaily: 10 } }), text)
                .today,
        ).toEqual([])
        expect(subject.buildHub(sourcesOf({ streak: counted }), text).shards[0]?.todayCounted).toBe(true)
    })
})

describe("buildHub sources", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("marks a shard whose source failed as unavailable with no numbers", () => {
        const hub = subject.buildHub(sourcesOf({ review: null, essentials: null }), text)

        expect(hub.shards[0]).toMatchObject({
            unavailable: true,
            progress: { label: "progress.unavailable", value: null },
        })
        expect(hub.shards[1]?.unavailable).toBe(true)
        expect(hub.today.map((item) => item.shard)).not.toContain("review")
    })

    it("shows experience counts only for the shards the read gave", () => {
        const hub = subject.buildHub(sourcesOf({ experience: { essentials: { verified: 2, pending: 1 } } }), text)

        expect(hub.shards[0]?.experience).toEqual({ verified: 2, pending: 1 })
        expect(hub.shards[1]?.experience).toBeNull()
    })

    it("shows a copy of the path the learner follows, and none when the source gave none", () => {
        const activePath = { pathId: "founder", title: "Founder", next: ["a", "b", "c"] }

        expect(subject.buildHub(sourcesOf({ activePath }), text).activePath).toEqual(activePath)
        expect(subject.buildHub(sourcesOf({ activePath: null }), text).activePath).toBeNull()
        expect(subject.buildHub(sourcesOf(), text).activePath).toBeNull()
    })

    it("shows the last seven days of the strip and the layers without any counter", () => {
        const hub = subject.buildHub(sourcesOf(), text)

        expect(hub.streak.days).toHaveLength(7)
        expect(hub.streak.days[0]?.day).toBe("d23")
        expect(hub.streak).toMatchObject({ current: 3, longest: 5, week: { goal: 4 }, freezes: { held: 1 } })
        expect(hub.layers.map((layer) => layer.route)).toEqual(["/paths/choose", "/profile", "/career/hiring"])
        expect(Object.keys(hub.layers[0] ?? {})).toEqual(["id", "label", "route"])
    })
})
