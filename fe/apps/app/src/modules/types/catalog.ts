import type { CatalogCaseCard, CatalogNode, CatalogToolbarLabels } from "@starci-next/ui"
import type { TopicView } from "./lesson"

/** The groups of the approved tree, in the order the aside lists them (decision.essentials.categories). */
export const LESSON_GROUPS = [
    "backend",
    "frontend",
    "data",
    "caching",
    "messaging",
    "realtime",
    "distributed",
    "security",
    "testing",
    "observability",
    "infra",
    "delivery",
    "cloud",
    "integrations",
    "ai",
    "casestudy",
] as const

/** How many source lessons each group of the approved tree has still to move into interactive lessons (decision.essentials.categories). */
export const LESSON_GROUP_SOURCES: Readonly<Record<(typeof LESSON_GROUPS)[number], number>> = {
    backend: 13,
    frontend: 33,
    data: 14,
    caching: 4,
    messaging: 10,
    realtime: 4,
    distributed: 18,
    security: 25,
    testing: 4,
    observability: 26,
    infra: 42,
    delivery: 24,
    cloud: 69,
    integrations: 8,
    ai: 12,
    casestudy: 37,
}

/** The source lessons of every group together. */
export const LESSON_SOURCE_TOTAL: number = Object.values(LESSON_GROUP_SOURCES).reduce((sum, each) => sum + each, 0)

/** The topics the catalog read, by id: their path totals and sources, which the topic cards show. */
export type CatalogTopics = Readonly<Record<string, TopicView>>

/** One option of a filter. */
type CatalogOptionView = { readonly id: string; readonly label: string }

/** The catalog as the screen draws it: the aside, the filter options and the tree of lesson cards that match the filters. */
export type CatalogView = {
    /** The number of published lessons. */
    readonly total: number
    /** The facts under the intro (published lessons, groups), already in words. */
    readonly facts: ReadonlyArray<string>
    readonly groups: ReadonlyArray<{ readonly id: string; readonly label: string; readonly count: number }>
    readonly languages: ReadonlyArray<CatalogOptionView>
    readonly providers: ReadonlyArray<CatalogOptionView>
    /** The sections that match the filters; empty when nothing matches. */
    readonly tree: ReadonlyArray<CatalogNode>
    /** The case-study collection, drawn before the groups while no filter hides it; undefined otherwise. */
    readonly cases: CatalogCases | undefined
    /** The lesson in progress, for a Premium learner; undefined when there is none. */
    readonly resume: CatalogResume | undefined
}

/** The case-study collection of the catalog: its title, what it is and its announced case studies. */
export type CatalogCases = {
    readonly title: string
    readonly meta: string
    readonly pending: string
    readonly cards: ReadonlyArray<CatalogCaseCard>
}

/** Where the learner stands on a lesson. */
export type LessonStatus = "none" | "doing" | "understood" | "proved" | "free"

/** The lesson a Premium learner left half way, worded. */
type CatalogResume = {
    readonly title: string
    readonly phaseLine: string
    readonly href: string
}

/** What the reader chose in the aside and the toolbar; an empty text means no filter. */
export type CatalogFilters = {
    readonly group: string
    readonly difficulty: string
    readonly query: string
    readonly language: string
    readonly provider: string
}

/** The words the catalog view is built with, resolved by the block. */
export type CatalogWords = {
    readonly groups: Readonly<Record<string, string>>
    readonly difficulty: Readonly<Record<string, string>>
    /** Where the learner stands on a lesson, by status; "free" is said to a reader without Premium. */
    readonly statuses: Readonly<Record<LessonStatus, string>>
    readonly isPremium: boolean
    /** The title of each phase, by phase id. */
    readonly phases: Readonly<Record<string, string>>
    readonly resume: (phase: string) => string
    readonly understood: (done: number, total: number) => string
    readonly all: string
    readonly minutes: (minutes: number) => string
    readonly count: (count: number) => string
    readonly published: (count: number) => string
    readonly groupCount: (count: number) => string
    readonly topicOpen: (count: number) => string
    /** "{open}/{total} lessons open" of a topic whose path is known. */
    readonly openOfTotal: (open: number, total: number) => string
    readonly topicCount: (count: number) => string
    readonly matchCount: (count: number) => string
    /** The chip of the intro: how many source lessons are being moved. */
    readonly sources: (count: number) => string
    /** The line under a group: how many source lessons are still to come. */
    readonly pendingGroup: (count: number) => string
    readonly source: (from: string) => string
    /** The small kind line over a topic card's title. */
    readonly topicKind: string
    readonly soon: string
    readonly languageNames: Readonly<Record<string, string>>
    readonly providerNames: Readonly<Record<string, string>>
    /** The words of each announced case study, by id. */
    readonly cases: ReadonlyArray<{ readonly id: string; readonly title: string; readonly needs: string }>
    readonly casesMeta: string
    readonly casesPending: string
    readonly caseBadge: string
}

/** The words of the catalog screen that do not depend on its data. */
export type CatalogLabels = {
    readonly eyebrow: string
    readonly title: string
    readonly description: string
    readonly all: string
    readonly asideLabel: string
    readonly asideEmpty: string
    readonly open: string
    readonly upsell: { readonly label: string; readonly note: string } | undefined
    readonly toolbar: CatalogToolbarLabels
    readonly difficulties: ReadonlyArray<{ readonly id: string; readonly label: string }>
    readonly resumeTitle: string
    readonly resumeAction: string
    readonly noResult: { readonly title: string; readonly text: string; readonly clear: string }
}
