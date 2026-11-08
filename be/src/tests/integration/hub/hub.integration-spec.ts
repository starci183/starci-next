import { HUB_MESSAGES } from "@modules/domain/hub"
import { learnersOf } from "../../fixtures/builders/identity.builder"
import { attemptDoors, type GraphqlBody } from "../../world/attempt-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

interface ExperienceBody {
    readonly verified: number
}

interface ProgressBody {
    readonly label: string
}

interface CounterBody {
    readonly current: number
}

interface ShardBody {
    readonly shard: string
    readonly order: number
    readonly label: string
    readonly route: string
    readonly unavailable: boolean
    readonly experience: ExperienceBody | null
    readonly progress: ProgressBody
    readonly counter: CounterBody
}

interface TodayBody {
    readonly shard: string
    readonly link: string
}

interface WeekBody {
    readonly activeDays: number
    readonly goal: number
}

interface FreezesBody {
    readonly held: number
}

interface DayBody {
    readonly day: string
}

interface StreakCardBody {
    readonly current: number
    readonly todayCounted: boolean
    readonly week: WeekBody
    readonly freezes: FreezesBody
    readonly days: ReadonlyArray<DayBody>
}

interface LayerBody {
    readonly id: string
    readonly route: string
}

interface LearnerHubData {
    readonly activePath: unknown
    readonly today: ReadonlyArray<TodayBody>
    readonly streak: StreakCardBody
    readonly shards: ReadonlyArray<ShardBody>
    readonly layers: ReadonlyArray<LayerBody>
}

interface HubBody {
    readonly learnerHub: LearnerHubData
}

interface ShardCounterBody {
    readonly shard: string
}

interface StreakData {
    readonly current: number
    readonly days: ReadonlyArray<unknown>
    readonly shardCounters: ReadonlyArray<ShardCounterBody>
    readonly badges: ReadonlyArray<string>
}

interface StreakBody {
    readonly streak: StreakData
}

interface ReminderBody {
    readonly enabled: boolean
    readonly localTime: string
}

interface GoalData {
    readonly weeklyGoal: number
    readonly reminder: ReminderBody | null
}

interface GoalBody {
    readonly setStreakGoal: GoalData
}

const HUB = `query Hub($input: LearnerHubInput!) {
  learnerHub(input: $input) {
    activePath { pathId }
    today { shard link }
    streak { current todayCounted week { activeDays goal } freezes { held } days { day } }
    shards { shard order label route unavailable experience { verified } progress { label } counter { current } }
    layers { id route }
  }
}`

const STREAK = `query Streak { streak { current days { day } shardCounters { shard } badges } }`

const GOAL = `mutation Goal($input: SetStreakGoalInput!) {
  setStreakGoal(input: $input) { weeklyGoal reminder { enabled localTime } }
}`

/**
 * The hub and streak doors (integration): `learnerHub`, `streak` and `setStreakGoal` of the real core app behind the real session
 * guard. It proves the session gate, that opening the hub counts nothing, the six shards and three layers, and the goal range.
 */
describe("hub and streak doors (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = attemptDoors(world)
    const nextLearner = learnersOf("c9")

    beforeEach(async () => {
        await doors.reset()
    })

    it.each([
        [HUB, { input: { locale: "vi" } }],
        [STREAK, {}],
        [GOAL, { input: { activeDays: 3 } }],
    ])("refuses a caller with no session", async (query, variables) => {
        const answer = await doors.ask(query, variables)

        expect(answer.data ?? null).toBeNull()
        expect(answer.errors?.[0]?.extensions).toMatchObject({
            code: "IDENTITY_SESSION_REQUIRED",
            kind: "unauthenticated",
        })
    })

    it("shows a new learner the six shards in order, the three layers and a streak that counts nothing", async () => {
        const { cookie } = await doors.signIn(nextLearner(), false)

        const answer: GraphqlBody<HubBody> = await doors.ask<HubBody>(HUB, { input: { locale: "vi" } }, cookie)
        const again = await doors.ask<HubBody>(HUB, { input: { locale: "en" } }, cookie)
        const hub = answer.data?.learnerHub

        expect(answer.errors).toBeUndefined()
        expect(hub?.activePath).toBeNull()
        expect(hub?.shards.map((shard) => [shard.order, shard.shard, shard.label, shard.route])).toEqual([
            [1, "essentials", HUB_MESSAGES.vi["shards.essentials"], "/essentials"],
            [2, "review", HUB_MESSAGES.vi["shards.review"], "/review"],
            [3, "practice", HUB_MESSAGES.vi["shards.practice"], "/practice"],
            [4, "projects", HUB_MESSAGES.vi["shards.projects"], "/projects"],
            [5, "incidents", HUB_MESSAGES.vi["shards.incidents"], "/incidents"],
            [6, "interview", HUB_MESSAGES.vi["shards.interview"], "/interview"],
        ])
        expect(hub?.shards.every((shard) => shard.experience === null && shard.counter.current === 0)).toBe(true)
        expect(hub?.layers.map((layer) => layer.id)).toEqual(["mission", "profile", "hiring"])
        expect(hub?.streak).toMatchObject({
            current: 0,
            todayCounted: false,
            week: { activeDays: 0, goal: 4 },
            freezes: { held: 1 },
        })
        expect(hub?.streak.days).toHaveLength(7)
        expect(hub?.today.map((item) => item.shard)).toContain("essentials")
        expect(again.data?.learnerHub.shards[0]?.label).toBe(HUB_MESSAGES.en["shards.essentials"])
        const streak = await doors.ask<StreakBody>(STREAK, {}, cookie)
        expect(streak.data?.streak).toMatchObject({ current: 0, badges: [] })
        expect(streak.data?.streak.days).toHaveLength(30)
        expect(streak.data?.streak.shardCounters).toHaveLength(6)
    })

    it("stores the weekly goal and the reminder and shows the goal on the hub", async () => {
        const { cookie } = await doors.signIn(nextLearner(), false)

        const set = await doors.ask<GoalBody>(
            GOAL,
            { input: { activeDays: 5, reminder: { enabled: true, localTime: "21:15" } } },
            cookie,
        )
        const hub = await doors.ask<HubBody>(HUB, { input: { locale: "vi" } }, cookie)

        expect(set.data?.setStreakGoal).toEqual({ weeklyGoal: 5, reminder: { enabled: true, localTime: "21:15" } })
        expect(hub.data?.learnerHub.streak.week.goal).toBe(5)
    })

    it.each([1, 8])("answers STREAK_GOAL_INVALID for a goal of %s days", async (activeDays) => {
        const { cookie } = await doors.signIn(nextLearner(), false)

        const answer = await doors.ask(GOAL, { input: { activeDays } }, cookie)

        expect(answer.errors?.[0]?.extensions).toMatchObject({ code: "STREAK_GOAL_INVALID", kind: "invalid" })
    })
})
