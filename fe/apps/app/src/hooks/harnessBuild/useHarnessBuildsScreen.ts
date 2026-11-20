"use client"

import type { PageHeaderContent } from "@starci/grammar/common"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryHarnessBuildsSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { harnessBuildPath } from "@/modules/routes"
import type { DataSlot, SlotLabels } from "@/modules/types"
import { harnessHeaderOf, useHarnessCommonLabels } from "@/hooks/harness"

/** Where a build stands: every stage proved, some stage run on the learner's machine, or not begun. */
export type HarnessBuildStatus = "proved" | "practising" | "todo"

/** The filter ids of the list, "all" first. */
export type HarnessBuildFilter = "all" | HarnessBuildStatus

/** One tab of the status filter. */
export type HarnessBuildFilterTab = { readonly id: HarnessBuildFilter; readonly label: string; readonly count: number }

/** One build as the list of part 1 draws it. */
export type HarnessBuildItemView = {
    readonly id: string
    readonly title: string
    readonly summary: string
    readonly keys: string
    readonly practising: string
    readonly proved: string
    readonly isDone: boolean
    readonly status: HarnessBuildStatus
    readonly href: string
}

/** The words of the list of builds. */
export type HarnessBuildsLabels = {
    readonly listTitle: string
    readonly empty: string
    readonly noMatch: string
    readonly filterLabel: string
}

/** The list of builds of part 1. */
export type HarnessBuildsScreen = {
    readonly props: {
        readonly header: PageHeaderContent
        readonly slot: DataSlot<ReadonlyArray<HarnessBuildItemView>>
        readonly placeholder: ReadonlyArray<HarnessBuildItemView>
        readonly slotLabels: SlotLabels
        readonly labels: HarnessBuildsLabels
        readonly filter: HarnessBuildFilter
        readonly tabs: ReadonlyArray<HarnessBuildFilterTab>
    }
    readonly on: { readonly retry: () => void; readonly filter: (id: string) => void }
}

/** The same-shape list the skeleton draws while the first read runs. */
export const HARNESS_BUILDS_PLACEHOLDER: ReadonlyArray<HarnessBuildItemView> = [1, 2, 3].map((n) => ({
    id: `placeholder-${n}`,
    title: "xxxxxxxxxxxxxxxx",
    summary: "xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    keys: "xxxxxx",
    practising: "x / x",
    proved: "xxxxxx",
    isDone: false,
    status: "todo" as const,
    href: `/${n}`,
}))

/** Where one build of the catalog stands. */
const statusOf = (build: {
    readonly stageCount: number
    readonly provedStages: number
    readonly practisingStages: number
}): HarnessBuildStatus =>
    build.stageCount > 0 && build.provedStages === build.stageCount
        ? "proved"
        : build.practisingStages > 0 || build.provedStages > 0
          ? "practising"
          : "todo"

/** The connected list of builds: reads the catalog and words each build with its e2e and stage counts. */
export const useHarnessBuildsScreen = (): HarnessBuildsScreen => {
    const locale = useLocale()
    const t = useTranslations("app.harness.builds")
    const common = useHarnessCommonLabels()
    const slotLabels = useSlotLabels()
    const read = useQueryHarnessBuildsSwr(locale)
    const [filter, setFilter] = useState<HarnessBuildFilter>("all")
    useDocumentTitle(t("title"))
    return {
        props: {
            header: harnessHeaderOf(common, {
                active: "build",
                title: t("title"),
                description: t("description"),
                trail: [],
            }),
            slot: mapSlot(slotOfSwr(read), (builds) =>
                builds
                    .map((build): HarnessBuildItemView => ({
                        id: build.id,
                        title: build.title,
                        summary: build.summary,
                        keys: build.keys.join(" · "),
                        practising: t("practising", { n: build.practisingStages, total: build.stageCount }),
                        proved: t("proved", { n: build.provedStages, total: build.stageCount }),
                        isDone: build.stageCount > 0 && build.provedStages === build.stageCount,
                        status: statusOf(build),
                        href: harnessBuildPath(build.id),
                    }))
                    .filter((item) => filter === "all" || item.status === filter),
            ),
            placeholder: HARNESS_BUILDS_PLACEHOLDER,
            slotLabels: slotLabels(t("empty")),
            labels: {
                listTitle: t("listTitle"),
                empty: filter === "all" ? t("empty") : t("noMatch"),
                noMatch: t("noMatch"),
                filterLabel: t("filterLabel"),
            },
            filter,
            tabs: (["all", "practising", "proved", "todo"] as const).map((id) => ({
                id,
                label: t(`filter.${id}`),
                count: (read.data ?? []).filter((build) => id === "all" || statusOf(build) === id).length,
            })),
        },
        on: { retry: () => void read.mutate(), filter: (id) => setFilter(id as HarnessBuildFilter) },
    }
}
