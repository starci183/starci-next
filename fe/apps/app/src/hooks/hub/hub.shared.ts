import type {
    HubDayView,
    HubExperienceView,
    HubGoalEditorLabels,
    HubPathLabels,
    HubPathView,
    HubStreakLabels,
    HubStreakView,
    HubTodayRow,
} from "@starci-next/ui"
import type { LearnerHub } from "@/hooks/swr"
import { ApiFailure } from "@/modules/failure"

/** The words the hub is built with, resolved by the block from the `app.hub` catalog. */
export type HubWords = {
    readonly streakUnit: (count: number) => string
    readonly streakLine: (longest: number, freezes: number) => string
    readonly weekTitle: string
    readonly weekValue: (done: number, goal: number) => string
    readonly dayCounted: string
    readonly dayMissed: string
    readonly dayFreeze: string
    readonly dayToday: string
    readonly weekday: Readonly<Record<"sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat", string>>
    readonly todayLeft: (count: number) => string
    readonly todayDone: string
}

/** The hub as it is drawn, every word resolved. */
export type HubScreen = {
    readonly path: HubPathView | undefined
    readonly todayTitle: string
    readonly today: ReadonlyArray<HubTodayRow>
    readonly streak: HubStreakView
    /** The verified and pending experience counts, summed over the learning parts, without the words. */
    readonly experience: { readonly verified: number; readonly pending: number }
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
    readonly experience: Omit<HubExperienceView, "verified" | "pending">
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

/** The streak: the current run as a figure with its unit, the best run with the freezes left, the weekly goal and the strip. */
const streakOf = (hub: LearnerHub, words: HubWords): HubStreakView => ({
    currentFigure: String(hub.streak.current),
    currentUnit: words.streakUnit(hub.streak.current),
    line: words.streakLine(hub.streak.longest, hub.streak.freezes.held),
    weekTitle: words.weekTitle,
    weekLabel: words.weekValue(hub.streak.week.activeDays, hub.streak.week.goal),
    weekPercent: percentOf(hub.streak.week.activeDays, hub.streak.week.goal),
    days: daysOf(hub, words),
})

/** The experience counts of the learner, summed over the learning parts whose experience read answered. */
const experienceOf = (hub: LearnerHub): HubScreen["experience"] =>
    hub.shards.reduce(
        (sum, shard) => ({
            verified: sum.verified + (shard.experience?.verified ?? 0),
            pending: sum.pending + (shard.experience?.pending ?? 0),
        }),
        { verified: 0, pending: 0 },
    )

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
        shard: entry.shard,
        part: hub.shards.find((shard) => shard.shard === entry.shard)?.label ?? entry.shard,
        href: entry.link,
    })),
    streak: streakOf(hub, words),
    experience: experienceOf(hub),
})

/** The stable code the goal door answers for a number of days outside 2 to 7. */
const GOAL_INVALID_CODE = "STREAK_GOAL_INVALID"

/** True when the failure says the chosen weekly goal is outside 2 to 7. */
export const isGoalInvalid = (error: unknown): boolean =>
    error instanceof ApiFailure && error.code === GOAL_INVALID_CODE
