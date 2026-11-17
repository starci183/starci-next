"use client"

import { useLocale, useTranslations } from "next-intl"
import { mapSlot, settledListSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryPracticeNextSwr, useQueryPracticePatternsSwr, useQueryPracticeProblemsSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES, practicePatternPath, practiceProblemPath } from "@/modules/routes"
import type { DataSlot, PracticeProblemItemView, SlotLabels } from "@/modules/types"
import { difficultyToneOf, tagLabelOf } from "./practice.shared"

/** One problem of the pattern as the list draws it. */
export type PracticeProblemItem = {
    readonly id: string
    readonly position: number
    readonly title: string
    readonly difficulty: string
    readonly difficultyTone: "success" | "warning" | "danger" | "neutral"
    readonly tags: ReadonlyArray<string>
    readonly status: string
    readonly statusTone: "success" | "warning" | "muted"
    readonly href: string
}

/** The pattern that follows this one, with where the learner stands in it. */
export type PracticeNextPatternView = {
    readonly position: number
    readonly title: string
    readonly description: string
    readonly href: string
}

/** The words of the screen. */
export type PracticePatternLabels = {
    readonly breadcrumbs: string
    readonly catalog: string
    readonly introTitle: string
    readonly listTitle: string
    readonly listLabel: string
    readonly progressTitle: string
    readonly progressLabel: string
    readonly nextTitle: string
    readonly emptyTitle: string
    readonly emptyText: string
    readonly emptyAction: string
    readonly catalogHref: string
}

/** The pattern screen: the header, the problems, the intro and the rail, every word resolved. */
export type PracticePatternScreen = {
    readonly props: {
        readonly header: {
            readonly title: string
            readonly meta: string
            readonly action: { readonly label: string; readonly href: string } | null
            readonly crumb: string
        }
        readonly slot: DataSlot<ReadonlyArray<PracticeProblemItem>>
        readonly placeholder: ReadonlyArray<PracticeProblemItem>
        readonly slotLabels: SlotLabels
        readonly errorDescription: string
        readonly labels: PracticePatternLabels
        readonly intro: string
        readonly progress: { readonly percent: number; readonly text: string }
        readonly nextPattern: PracticeNextPatternView | null
    }
    readonly on: { readonly retry: () => void }
}

/** The same-shape list the skeleton draws while the first read runs. */
export const PRACTICE_PATTERN_PLACEHOLDER: ReadonlyArray<PracticeProblemItem> = [1, 2, 3, 4].map((n) => ({
    id: `placeholder-${n}`,
    position: n,
    title: "xxxxxxxxxxxxxx",
    difficulty: "xxxxxx",
    difficultyTone: "neutral",
    tags: ["xxxxxx"],
    status: "xxxxxx",
    statusTone: "muted",
    href: `/${n}`,
}))

/** The tone of a status badge. */
const statusToneOf = (status: PracticeProblemItemView["status"]): PracticeProblemItem["statusTone"] => {
    if (status === "ACCEPTED") return "success"
    return status === "ATTEMPTED" ? "warning" : "muted"
}

/** The connected pattern screen: reads the problems, the pattern list (which names it) and the next problem of this pattern. */
export const usePracticePatternScreen = (patternId: string): PracticePatternScreen => {
    const locale = useLocale()
    const t = useTranslations("app.practice.pattern")
    const word = useTranslations("app.practice.difficulty")
    const status = useTranslations("app.practice.status")
    const difficulties: Readonly<Record<string, string>> = {
        easy: word("easy"),
        medium: word("medium"),
        hard: word("hard"),
    }
    const statuses = { UNSOLVED: status("unsolved"), ATTEMPTED: status("attempted"), ACCEPTED: status("accepted") }
    const slotLabels = useSlotLabels()(t("emptyTitle"))
    const read = useQueryPracticeProblemsSwr(patternId, locale)
    const patterns = useQueryPracticePatternsSwr(locale)
    const next = useQueryPracticeNextSwr(locale, patternId)
    const list = patterns.data ?? []
    const index = list.findIndex((each) => each.patternId === patternId)
    const pattern = index < 0 ? undefined : list[index]
    const following = index < 0 ? undefined : list[index + 1]
    const problems = read.data ?? []
    const accepted = problems.filter((problem) => problem.status === "ACCEPTED").length
    const title = pattern?.title ?? t("pageTitle")
    useDocumentTitle(pattern === undefined ? undefined : `${pattern.title} · ${t("catalog")}`)
    const isFailed = read.error !== undefined && read.data === undefined
    const target = next.data?.next ?? null
    const meta = ((): string => {
        if (isFailed) return t("metaFailed")
        if (read.data === undefined) return t("metaLoading")
        if (problems.length === 0) return t("metaEmpty")
        return accepted === 0
            ? t("metaFirst", { accepted, total: problems.length })
            : t("meta", { accepted, total: problems.length })
    })()
    const items = problems.map((problem, position): PracticeProblemItem => ({
        id: problem.slug,
        position: position + 1,
        title: problem.title,
        difficulty: difficulties[problem.difficulty.toLowerCase()] ?? problem.difficulty,
        difficultyTone: difficultyToneOf(problem.difficulty),
        tags: problem.tags.map(tagLabelOf),
        status: statuses[problem.status],
        statusTone: statusToneOf(problem.status),
        href: practiceProblemPath(problem.slug),
    }))
    return {
        props: {
            header: {
                title,
                meta,
                crumb: t("catalog"),
                action:
                    target === null || problems.length === 0
                        ? null
                        : {
                              label: accepted === 0 ? t("startFirst") : t("continue"),
                              href: practiceProblemPath(target.slug),
                          },
            },
            slot: settledListSlot(mapSlot(slotOfSwr(read), () => items)),
            placeholder: PRACTICE_PATTERN_PLACEHOLDER,
            slotLabels: { ...slotLabels, error: t("errorTitle") },
            errorDescription: t("errorText"),
            labels: {
                breadcrumbs: t("breadcrumbs"),
                catalog: t("catalog"),
                introTitle: t("introTitle"),
                listTitle: t("listTitle"),
                listLabel: t("listLabel"),
                progressTitle: t("progressTitle"),
                progressLabel: t("progressLabel"),
                nextTitle: t("nextTitle"),
                emptyTitle: t("emptyTitle"),
                emptyText: t("emptyText"),
                emptyAction: t("emptyAction"),
                catalogHref: APP_ROUTES.practice,
            },
            intro: pattern?.intro ?? "",
            progress: {
                percent: problems.length === 0 ? 0 : Math.round((accepted / problems.length) * 100),
                text: t("progressText", { accepted, total: problems.length }),
            },
            nextPattern:
                following === undefined
                    ? null
                    : {
                          position: index + 2,
                          title: following.title,
                          description: t("nextRow", {
                              accepted: following.acceptedCount,
                              total: following.problemCount,
                          }),
                          href: practicePatternPath(following.patternId),
                      },
        },
        on: { retry: () => void read.mutate() },
    }
}
