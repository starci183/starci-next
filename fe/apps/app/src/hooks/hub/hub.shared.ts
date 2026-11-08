import type {
    HubDayView,
    HubGoalEditorLabels,
    HubLayerView,
    HubPathLabels,
    HubPathView,
    HubShardLabels,
    HubShardView,
    HubStreakLabels,
    HubStreakView,
    HubTodayRow,
} from "@starci-next/ui"
import type { LearnerHub } from "@/hooks/swr"
import { ApiFailure } from "@/modules/failure"

/** The words the hub is built with, resolved by the block from the `app.hub` catalog. */
export type HubWords = {
    readonly counter: (count: number) => string
    readonly counterOff: string
    readonly verified: (count: number) => string
    readonly pending: (count: number) => string
    readonly streakCurrent: (count: number) => string
    readonly streakLongest: (count: number) => string
    readonly freezes: (count: number) => string
    readonly weekGoal: (done: number, goal: number) => string
    readonly dayCounted: string
    readonly dayMissed: string
    readonly dayFreeze: string
    readonly dayToday: string
    readonly weekday: Readonly<Record<"sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat", string>>
    readonly stage: Readonly<Record<string, string>>
    readonly next: Readonly<Record<string, string>>
    readonly layerBody: Readonly<Record<string, string>>
    readonly todayLeft: (count: number) => string
    readonly todayDone: string
}

/** The hub as it is drawn, every word resolved. */
export type HubScreen = {
    readonly path: HubPathView | undefined
    readonly todayTitle: string
    readonly today: ReadonlyArray<HubTodayRow>
    readonly streak: HubStreakView
    readonly shards: ReadonlyArray<HubShardView>
    readonly layers: ReadonlyArray<HubLayerView>
}

/** The fixed words of the hub screen. */
export type HubLabelSet = {
    readonly pageTitle: string
    readonly pageDescription: string
    readonly path: HubPathLabels
    readonly todayLabel: string
    readonly todayEmpty: string
    readonly streak: HubStreakLabels
    readonly goal: HubGoalEditorLabels
    readonly shardsTitle: string
    readonly shardsSubtitle: string
    readonly shard: HubShardLabels
    readonly layersTitle: string
    readonly layersSubtitle: string
    readonly layerOpen: string
    readonly guide: {
        readonly trigger: string
        readonly title: string
        readonly description: string
        readonly close: string
    }
    readonly signedOut: { readonly title: string; readonly body: string; readonly action: string }
}

/** The weekday keys, indexed like `Date#getUTCDay`. */
const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const

/** The weekday key of a calendar day written `YYYY-MM-DD`; the day is read as a plain date, never shifted by a zone. */
const weekdayOf = (day: string): (typeof WEEKDAYS)[number] =>
    WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()] ?? "mon"

/** The share of a bar, 0 to 100, or 0 when the total is unknown. */
const percentOf = (value: number, total: number): number =>
    total <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((value / total) * 100)))

/** The state of one day of the strip: counted, covered by a freeze, today still open, or missed. */
const dayStateOf = (counted: boolean, freezeUsed: boolean, isLast: boolean): HubDayView["state"] => {
    if (counted) return "counted"
    if (freezeUsed) return "freeze"
    return isLast ? "today" : "missed"
}

/** The seven days of the strip. */
const daysOf = (hub: LearnerHub, words: HubWords): ReadonlyArray<HubDayView> => {
    const spoken = {
        counted: words.dayCounted,
        freeze: words.dayFreeze,
        today: words.dayToday,
        missed: words.dayMissed,
    }
    const last = hub.streak.days.length - 1
    return hub.streak.days.map((entry, index) => {
        const state = dayStateOf(entry.counted, entry.freezeUsed, index === last)
        return { id: entry.day, label: words.weekday[weekdayOf(entry.day)], state, title: spoken[state] }
    })
}

/** The streak card: the current run, the best run, freezes, the weekly goal and the strip. */
const streakOf = (hub: LearnerHub, words: HubWords): HubStreakView => ({
    current: words.streakCurrent(hub.streak.current),
    longest: words.streakLongest(hub.streak.longest),
    freezes: words.freezes(hub.streak.freezes.held),
    weekLabel: words.weekGoal(hub.streak.week.activeDays, hub.streak.week.goal),
    weekPercent: percentOf(hub.streak.week.activeDays, hub.streak.week.goal),
    days: daysOf(hub, words),
})

/** One shard card; the experience counts exist only while the experience read answers them. */
const shardOf = (hub: LearnerHub, words: HubWords, shard: LearnerHub["shards"][number]): HubShardView => {
    const prompt = hub.today.find((entry) => entry.shard === shard.shard)
    const experience = shard.experience
    return {
        id: shard.shard,
        stage: words.stage[shard.shard] ?? "",
        title: shard.label,
        href: shard.route,
        next: prompt?.title ?? words.next[shard.shard] ?? "",
        progressLabel: shard.progress.label,
        counter: shard.counter.current > 0 ? words.counter(shard.counter.current) : words.counterOff,
        isSoon: shard.status === "coming-soon",
        verified: experience === null ? undefined : words.verified(experience.verified),
        pending: experience === null || experience.pending <= 0 ? undefined : words.pending(experience.pending),
    }
}

/** The active path, or undefined when the learner follows none. */
const pathOf = (hub: LearnerHub): HubPathView | undefined =>
    hub.activePath === null ? undefined : { title: hub.activePath.title, next: hub.activePath.next }

/** Builds everything the hub draws from the one read and the resolved words. */
export const hubScreenOf = (hub: LearnerHub, words: HubWords): HubScreen => ({
    path: pathOf(hub),
    todayTitle: hub.today.length === 0 ? words.todayDone : words.todayLeft(hub.today.length),
    today: hub.today.map((entry, index) => ({
        id: `${entry.shard}-${entry.kind}-${index}`,
        title: entry.title,
        part: hub.shards.find((shard) => shard.shard === entry.shard)?.label ?? entry.shard,
        href: entry.link,
    })),
    streak: streakOf(hub, words),
    shards: [...hub.shards].sort((a, b) => a.order - b.order).map((shard) => shardOf(hub, words, shard)),
    layers: hub.layers.map((layer) => ({
        id: layer.id,
        title: layer.label,
        body: words.layerBody[layer.id] ?? "",
        href: layer.route,
    })),
})

/** The stable code the goal door answers for a number of days outside 2 to 7. */
const GOAL_INVALID_CODE = "STREAK_GOAL_INVALID"

/** True when the failure says the chosen weekly goal is outside 2 to 7. */
export const isGoalInvalid = (error: unknown): boolean =>
    error instanceof ApiFailure && error.code === GOAL_INVALID_CODE
