"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { mapSlot, settledListSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryPracticeNextSwr, useQueryPracticePatternsSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { practicePatternPath, practiceProblemPath } from "@/modules/routes"
import type { DataSlot, PracticePatternRow, SlotLabels } from "@/modules/types"

/** Where a pattern stands for the learner: nothing yet, some problems accepted, or all of them. */
export type PracticePatternState = "new" | "doing" | "done"

/** The filter chips of the list: every pattern, or the patterns in one state. */
export type PracticeCatalogFilter = "all" | "doing" | "new" | "done"

/** One pattern as the list draws it. */
export type PracticePatternItemView = {
    readonly id: string
    readonly title: string
    readonly position: number
    readonly description: string
    /** The share of the pattern's problems accepted, 0 to 100. */
    readonly percent: number
    readonly href: string
}

/** The numbers of the readiness card. */
export type PracticeReadinessView = { readonly accepted: number; readonly total: number }

/** The problem the learner left unfinished, in words. */
export type PracticeResumeView = {
    readonly title: string
    readonly description: string
    readonly href: string
}

/** The words of the screen. */
export type PracticeCatalogLabels = {
    readonly listTitle: string
    readonly listCaption: string
    readonly listLabel: string
    readonly searchLabel: string
    readonly searchPlaceholder: string
    readonly filterLabel: string
    readonly noMatchTitle: string
    readonly noMatchText: string
    readonly clearFilters: string
    readonly readinessTitle: string
    readonly readinessUnit: string
    readonly readinessText: string
    readonly resumeTitle: string
    readonly resumeAction: string
    readonly gradingTitle: string
    readonly grading: ReadonlyArray<string>
    readonly firstTitle: string
    readonly firstText: string
    readonly errorTitle: string
}

/** The page header: the title, the one line of facts and the one primary command. */
export type PracticeCatalogHeader = {
    readonly title: string
    readonly meta: string
    readonly action:
        { readonly label: string; readonly href: string } | { readonly label: string; readonly retry: true } | null
}

/** The Practice catalog screen: every number and word resolved, the filter state and its commands. */
export type PracticeCatalogScreen = {
    readonly props: {
        readonly header: PracticeCatalogHeader
        readonly slot: DataSlot<ReadonlyArray<PracticePatternItemView>>
        readonly placeholder: ReadonlyArray<PracticePatternItemView>
        readonly slotLabels: SlotLabels
        readonly errorDescription: string
        readonly labels: PracticeCatalogLabels
        readonly readiness: PracticeReadinessView
        readonly resume: PracticeResumeView | null
        readonly isFirstVisit: boolean
        readonly query: string
        readonly filter: PracticeCatalogFilter
        readonly filterOptions: ReadonlyArray<{
            readonly value: string
            readonly label: string
            readonly count: number
        }>
    }
    readonly on: {
        readonly retry: () => void
        readonly setQuery: (value: string) => void
        readonly setFilter: (value: string) => void
        readonly clearFilters: () => void
    }
}

/** The same-shape list the skeleton draws while the first read runs. */
export const PRACTICE_CATALOG_PLACEHOLDER: ReadonlyArray<PracticePatternItemView> = [1, 2, 3, 4, 5].map((n) => ({
    id: `placeholder-${n}`,
    title: "xxxxxxxxxxxx",
    position: n,
    description: "xxxxxxxxxxxxxxxx",
    percent: 0,
    href: `/${n}`,
}))

/** The filters, in the order the chips list them. */
const FILTERS: ReadonlyArray<PracticeCatalogFilter> = ["all", "doing", "new", "done"]

/** The filter a chip value names; anything else keeps every pattern. */
const filterOf = (value: string): PracticeCatalogFilter => FILTERS.find((each) => each === value) ?? "all"

/** Where a pattern stands: done when all its problems are accepted, doing once one is, else new. */
const stateOf = (pattern: PracticePatternRow): PracticePatternState => {
    if (pattern.problemCount > 0 && pattern.acceptedCount >= pattern.problemCount) return "done"
    return pattern.acceptedCount > 0 ? "doing" : "new"
}

/** The text the search matches a pattern against: its title without accents or case. */
const foldOf = (text: string): string =>
    text
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/đ/g, "d")
        .toLowerCase()

/** The connected Practice catalog: reads the patterns and the next problem, words each pattern and filters in the browser. */
export const usePracticeCatalogScreen = (): PracticeCatalogScreen => {
    const locale = useLocale()
    const t = useTranslations("app.practice.catalog")
    const slotLabels = useSlotLabels()(t("emptyTitle"))
    const read = useQueryPracticePatternsSwr(locale)
    const next = useQueryPracticeNextSwr(locale)
    const [query, setQuery] = useState("")
    const [filter, setFilter] = useState<PracticeCatalogFilter>("all")
    useDocumentTitle(t("pageTitle"))
    const patterns = read.data ?? []
    const stateById = new Map(patterns.map((pattern) => [pattern.patternId, stateOf(pattern)]))
    const searched = foldOf(query.trim())
    const matchesSearch = (title: string): boolean => searched === "" || foldOf(title).includes(searched)
    const countOf = (each: PracticeCatalogFilter): number =>
        patterns.filter(
            (pattern) => (each === "all" || stateById.get(pattern.patternId) === each) && matchesSearch(pattern.title),
        ).length
    const items = patterns.map((pattern, index): PracticePatternItemView => ({
        id: pattern.patternId,
        title: pattern.title,
        position: index + 1,
        description: t(`rowState.${stateById.get(pattern.patternId) ?? "new"}`, {
            accepted: pattern.acceptedCount,
            total: pattern.problemCount,
        }),
        percent: pattern.problemCount === 0 ? 0 : Math.round((pattern.acceptedCount / pattern.problemCount) * 100),
        href: practicePatternPath(pattern.patternId),
    }))
    const wanted = foldOf(query.trim())
    const shown = items.filter(
        (item) =>
            (filter === "all" || stateById.get(item.id) === filter) &&
            (wanted === "" || foldOf(item.title).includes(wanted)),
    )
    const total = patterns.reduce((sum, pattern) => sum + pattern.problemCount, 0)
    const accepted = patterns.reduce((sum, pattern) => sum + pattern.acceptedCount, 0)
    const target = next.data?.next ?? null
    const resumeRead = next.data?.resume ?? null
    const isFailed = read.error !== undefined && read.data === undefined
    const header = ((): PracticeCatalogHeader => {
        const meta =
            accepted === 0
                ? t("metaFirst", { patterns: patterns.length, problems: total })
                : t("meta", { patterns: patterns.length, problems: total, accepted })
        if (isFailed)
            return { title: t("pageTitle"), meta: t("metaFree"), action: { label: slotLabels.retry, retry: true } }
        if (read.data === undefined) return { title: t("pageTitle"), meta: t("metaFree"), action: null }
        if (target === null) return { title: t("pageTitle"), meta, action: null }
        return {
            title: t("pageTitle"),
            meta,
            action: {
                label: accepted === 0 ? t("start", { pattern: target.patternTitle }) : t("continue"),
                href: practiceProblemPath(target.slug),
            },
        }
    })()
    return {
        props: {
            header,
            slot: settledListSlot(mapSlot(slotOfSwr(read), () => shown)),
            placeholder: PRACTICE_CATALOG_PLACEHOLDER,
            slotLabels: { ...slotLabels, error: t("errorTitle") },
            errorDescription: t("errorText"),
            labels: {
                listTitle: t("listTitle"),
                listCaption: t("listCaption"),
                listLabel: t("listLabel"),
                searchLabel: t("searchLabel"),
                searchPlaceholder: t("searchPlaceholder"),
                filterLabel: t("filterLabel"),
                noMatchTitle: t("noMatchTitle"),
                noMatchText: t("noMatchText"),
                clearFilters: t("clearFilters"),
                readinessTitle: t("readinessTitle"),
                readinessUnit: t("readinessUnit", { total }),
                readinessText: t("readinessText"),
                resumeTitle: t("resumeTitle"),
                resumeAction: t("resumeAction"),
                gradingTitle: t("gradingTitle"),
                grading: [t("grading.judge"), t("grading.hints"), t("grading.free")],
                firstTitle: t("firstTitle"),
                firstText: t("firstText"),
                errorTitle: t("errorTitle"),
            },
            readiness: { accepted, total },
            resume:
                resumeRead === null
                    ? null
                    : {
                          title: resumeRead.title,
                          description:
                              resumeRead.failedTestIndex === null
                                  ? t("resumeLine", { pattern: resumeRead.patternTitle, attempts: resumeRead.attempts })
                                  : t("resumeLineTest", {
                                        pattern: resumeRead.patternTitle,
                                        attempts: resumeRead.attempts,
                                        test: resumeRead.failedTestIndex + 1,
                                    }),
                          href: practiceProblemPath(resumeRead.slug),
                      },
            isFirstVisit: read.data !== undefined && accepted === 0 && resumeRead === null,
            query,
            filter,
            filterOptions: FILTERS.map((each) => ({
                value: each,
                label: t(`filters.${each}`),
                count: countOf(each),
            })),
        },
        on: {
            retry: () => void read.mutate(),
            setQuery,
            setFilter: (value) => setFilter(filterOf(value)),
            clearFilters: () => {
                setQuery("")
                setFilter("all")
            },
        },
    }
}
