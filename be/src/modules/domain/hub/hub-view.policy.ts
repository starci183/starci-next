import { STREAK_SHARD_IDS, type StreakShard } from "@modules/domain/streak"
import type {
    HubActivePathView,
    HubLayerView,
    HubProgressView,
    HubShardView,
    HubSources,
    HubTodayView,
    LearnerHubView,
} from "./hub.contracts"

/** Looks a hub text up by key in the asked locale. */
export type HubText = (key: string, params?: Readonly<Record<string, string | number>>) => string

/** Where a shard lives and whether it is open; flip a status to `coming-soon` to show the promise without a door. */
interface ShardPlan {
    readonly route: string
    readonly status: "live" | "coming-soon"
}

const SHARD_PLAN: Readonly<Record<StreakShard, ShardPlan>> = {
    essentials: { route: "/essentials", status: "live" },
    review: { route: "/review", status: "live" },
    practice: { route: "/practice", status: "live" },
    projects: { route: "/projects", status: "live" },
    incidents: { route: "/incidents", status: "live" },
    interview: { route: "/interview", status: "live" },
}

/** A layer under the shards: its id (its name is in the catalog under `layers.<id>`) and where it lives. */
interface LayerPlan {
    readonly id: string
    readonly route: string
}

const LAYERS: ReadonlyArray<LayerPlan> = [
    { id: "mission", route: "/paths/choose" },
    { id: "profile", route: "/profile" },
    { id: "hiring", route: "/career/hiring" },
]

/** The prompts offered while today does not count yet: the shard and the kind of work. */
const PROMPTS: ReadonlyArray<readonly [StreakShard, string]> = [
    ["essentials", "lesson"],
    ["practice", "practice"],
    ["projects", "project"],
    ["incidents", "incident"],
    ["interview", "interview"],
]

/** A line of progress with its numbers. */
const lineOf = (label: string, value: number | null, total: number | null): HubProgressView => ({
    label,
    value,
    total,
})

/** The progress of a shard from what its source gave; null when its source failed, the idle line when it has none. */
const progressOf = (shard: StreakShard, sources: HubSources, text: HubText): HubProgressView | null => {
    const { essentials, review } = sources
    if (shard === "essentials" && essentials !== null) {
        return lineOf(
            text("progress.essentials", { started: essentials.started, total: essentials.total }),
            essentials.started,
            essentials.total,
        )
    }
    if (shard === "review" && review !== null) {
        const label = review.due > 0 ? text("progress.reviewDue", { due: review.due }) : text("progress.reviewNone")
        return lineOf(label, review.due, null)
    }
    return shard === "essentials" || shard === "review" ? null : lineOf(text("progress.idle"), null, null)
}

/** What is left for today's streak: the review items due, and while today does not count yet one prompt per shard. */
const todayOf = (sources: HubSources, text: HubText): Array<HubTodayView> => {
    const items: Array<HubTodayView> = []
    if (sources.review !== null && sources.review.due > 0) {
        items.push({
            shard: "review",
            kind: "review",
            title: text("today.review", { due: sources.review.due }),
            link: "/review/session",
            dueAt: null,
        })
    }
    if (sources.streak.todayCounted) return items
    const prompts = PROMPTS.filter(([shard]) => SHARD_PLAN[shard].status === "live").map(([shard, kind]) => ({
        shard,
        kind,
        title: text(`today.${shard}`),
        link: SHARD_PLAN[shard].route,
        dueAt: null,
    }))
    return [...items, ...prompts]
}

/** The path the learner follows with its steps copied, or null. */
const activePathOf = (sources: HubSources): HubActivePathView | null =>
    sources.activePath === undefined || sources.activePath === null
        ? null
        : { ...sources.activePath, next: [...sources.activePath.next] }

/** The card of one shard: its plan, its counter from the streak, its progress and its experience counts. */
const shardOf = (shard: StreakShard, index: number, sources: HubSources, text: HubText): HubShardView => {
    const plan = SHARD_PLAN[shard]
    const counter = sources.streak.shardCounters.find((entry) => entry.shard === shard)
    const progress = progressOf(shard, sources, text)
    return {
        shard,
        order: index + 1,
        label: text(`shards.${shard}`),
        route: plan.route,
        status: plan.status,
        progress: progress ?? lineOf(text("progress.unavailable"), null, null),
        counter: { current: counter?.current ?? 0, longest: counter?.longest ?? 0 },
        activeDaysLast30: counter?.activeDaysLast30 ?? 0,
        todayCounted: sources.streak.todayShards.includes(shard),
        experience: sources.experience?.[shard] ?? null,
        unavailable: progress === null,
    }
}

/** Builds the hub from what the sources gave; a shard whose source is null shows as unavailable, never with wrong numbers. */
export const buildHub = (sources: HubSources, text: HubText): LearnerHubView => {
    const { streak } = sources
    const layers: Array<HubLayerView> = LAYERS.map((layer) => ({
        id: layer.id,
        label: text(`layers.${layer.id}`),
        route: layer.route,
    }))
    return {
        activePath: activePathOf(sources),
        today: todayOf(sources, text),
        streak: {
            current: streak.current,
            longest: streak.longest,
            todayCounted: streak.todayCounted,
            week: streak.week,
            freezes: streak.freezes,
            days: streak.days.slice(-7).map((day) => ({ ...day, shards: [...day.shards] })),
        },
        shards: STREAK_SHARD_IDS.map((shard, index) => shardOf(shard, index, sources, text)),
        layers,
    }
}
