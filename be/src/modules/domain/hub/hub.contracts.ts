import type { StreakShard, StreakSummary } from "@modules/domain/streak"

/** The locales the hub speaks. */
export type HubLocale = "vi" | "en"

/** The path the learner follows, as the path capability gives it. */
export interface HubActivePathSource {
    /** The path id. */
    readonly pathId: string
    /** The path title. */
    readonly title: string
    /** The next steps, at most three. */
    readonly next: ReadonlyArray<string>
}

/** The path the learner follows, as the hub shows it. */
export interface HubActivePathView {
    /** The path id. */
    readonly pathId: string
    /** The path title. */
    readonly title: string
    /** The next steps, at most three. */
    readonly next: Array<string>
}

/** One day of the streak strip. */
export interface HubDayView {
    /** The day, YYYY-MM-DD. */
    readonly day: string
    /** Whether a meaningful action happened. */
    readonly counted: boolean
    /** The shards that had an action. */
    readonly shards: Array<string>
    /** Whether a freeze covered the day. */
    readonly freezeUsed: boolean
}

/** One thing left to do today for the streak. */
export interface HubTodayView {
    /** The shard it belongs to. */
    readonly shard: StreakShard
    /** What it asks: review, lesson, practice, project, incident or interview. */
    readonly kind: string
    /** The title in the asked locale. */
    readonly title: string
    /** The route that does it. */
    readonly link: string
    /** When it falls due, when it has a due time. */
    readonly dueAt: string | null
}

/** A line of progress; the numbers are absent when the shard has none to show. */
export interface HubProgressView {
    /** The progress as text in the asked locale. */
    readonly label: string
    /** How far the learner is. */
    readonly value: number | null
    /** Out of how many. */
    readonly total: number | null
}

/** The experience items of a shard that are verified and that wait for the teacher. */
export interface HubExperienceView {
    /** Items the teacher verified. */
    readonly verified: number
    /** Items waiting for the teacher. */
    readonly pending: number
}

/** The experience counts per shard; a shard with none is absent. */
export type HubExperienceCounts = Readonly<Partial<Record<StreakShard, HubExperienceView>>>

/** The streak counter of one shard. */
export interface HubShardCounterView {
    /** The current run of days with an action of this shard. */
    readonly current: number
    /** The best run. */
    readonly longest: number
}

/** One learning shard on the hub. */
export interface HubShardView {
    /** The shard id. */
    readonly shard: StreakShard
    /** The position on the hub, from 1. */
    readonly order: number
    /** The name in the asked locale. */
    readonly label: string
    /** Where the shard lives. */
    readonly route: string
    /** `live` or `coming-soon`. */
    readonly status: string
    /** The progress line. */
    readonly progress: HubProgressView
    /** The streak counter of this shard. */
    readonly counter: HubShardCounterView
    /** The days with an action of this shard in the last 30. */
    readonly activeDaysLast30: number
    /** Whether this shard already counted today. */
    readonly todayCounted: boolean
    /** The experience counts; null while no experience read exists. */
    readonly experience: HubExperienceView | null
    /** True when the numbers could not be read; the card shows without them. */
    readonly unavailable: boolean
}

/** A layer that sits on the shards and has no streak. */
export interface HubLayerView {
    /** `mission`, `profile` or `hiring`. */
    readonly id: string
    /** The name in the asked locale. */
    readonly label: string
    /** Where it lives. */
    readonly route: string
}

/** The streak card of the hub. */
export interface HubStreakView {
    /** The streak, today included once it counts. */
    readonly current: number
    /** The best streak. */
    readonly longest: number
    /** Whether today counts. */
    readonly todayCounted: boolean
    /** The week so far and its goal. */
    readonly week: StreakSummary["week"]
    /** The freezes held. */
    readonly freezes: StreakSummary["freezes"]
    /** The last seven days, oldest first. */
    readonly days: Array<HubDayView>
}

/** Everything the hub screen shows. */
export interface LearnerHubView {
    /** The active path, or null. */
    readonly activePath: HubActivePathView | null
    /** What is left for today's streak. */
    readonly today: Array<HubTodayView>
    /** The streak card. */
    readonly streak: HubStreakView
    /** The six learning shards. */
    readonly shards: Array<HubShardView>
    /** The three layers. */
    readonly layers: Array<HubLayerView>
}

/** The numbers of the essentials shard the hub shows. */
export interface HubEssentialsSource {
    /** The lessons the learner has attempted. */
    readonly started: number
    /** The lessons that are live. */
    readonly total: number
}

/** The counts of the review day the hub shows. */
export interface HubReviewSource {
    /** Items due today, overdue included. */
    readonly due: number
    /** Items reviewed today. */
    readonly doneToday: number
    /** The daily item goal. */
    readonly goalDaily: number
}

/** Everything the hub is built from; a source that could not be read is null. */
export interface HubSources {
    /** The streak, which the hub cannot do without. */
    readonly streak: StreakSummary
    /** The review day. */
    readonly review: HubReviewSource | null
    /** The essentials shard. */
    readonly essentials: HubEssentialsSource | null
    /** Experience counts per shard, or null while no experience read exists. */
    readonly experience: HubExperienceCounts | null
    /** The path the learner follows, or null when none is chosen or the read failed. */
    readonly activePath?: HubActivePathSource | null
}
