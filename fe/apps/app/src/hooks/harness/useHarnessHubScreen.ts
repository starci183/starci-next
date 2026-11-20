"use client"

import type { PageHeaderContent } from "@starci/grammar/common"
import { useLocale, useTranslations } from "next-intl"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryHarnessHubSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { HARNESS_ROUTES } from "@/modules/routes"
import {
    HARNESS_PARTS,
    HARNESS_TOOLS,
    type DataSlot,
    type HarnessHubPartView,
    type HarnessPart,
    type HarnessTool,
    type SlotLabels,
} from "@/modules/types"
import { harnessHeaderOf, type HarnessCommonLabels } from "./harness.shared"
import { useHarnessCommonLabels } from "./useHarnessCommonLabels"
import { useHarnessTool } from "./useHarnessTool"

/** One part of the harness as the hub's list draws it. */
export type HarnessPartRowView = {
    readonly id: HarnessPart
    readonly title: string
    readonly description: string
    /** The chips of what the part holds, joined into one line. */
    readonly topics: string
    /** Where the learner stands in the part, in words. */
    readonly progress: string
    readonly isDone: boolean
    readonly href: string
}

/** One figure of the ribbon: what it measures and its value. */
export type HarnessFigureView = {
    readonly id: string
    readonly term: string
    readonly value: string
}

/** The hub as drawn: the ribbon of figures and the three parts. */
export type HarnessHubView = {
    readonly figures: ReadonlyArray<HarnessFigureView>
    readonly parts: ReadonlyArray<HarnessPartRowView>
}

/** The words of the hub. */
export type HarnessHubLabels = {
    readonly figuresLabel: string
    readonly partsTitle: string
    readonly toolTitle: string
    readonly toolDescription: string
    readonly empty: string
    readonly open: string
}

/** The hub of the harness area. */
export type HarnessHubScreen = {
    readonly props: {
        readonly header: PageHeaderContent
        readonly slot: DataSlot<HarnessHubView>
        readonly placeholder: HarnessHubView
        readonly slotLabels: SlotLabels
        readonly labels: HarnessHubLabels
        readonly common: HarnessCommonLabels
        readonly tool: HarnessTool
        readonly toolOptions: ReadonlyArray<{ readonly value: string; readonly label: string }>
    }
    readonly on: {
        readonly retry: () => void
        readonly chooseTool: (value: string) => void
    }
}

/** The same-shape hub the skeleton draws while the first read runs. */
export const HARNESS_HUB_PLACEHOLDER: HarnessHubView = {
    figures: [1, 2, 3, 4].map((n) => ({ id: `f${n}`, term: "xxxxxxxx", value: "xx" })),
    parts: HARNESS_PARTS.map((id, index) => ({
        id,
        title: "xxxxxxxxxxxxxxxx",
        description: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        topics: "xxxxxxxx · xxxxxxxx",
        progress: "xxxxxx",
        isDone: false,
        href: `/${index}`,
    })),
}

/** The tool a picker value names; anything else is the first tool. */
const toolOf = (value: string): HarnessTool => HARNESS_TOOLS.find((each) => each === value) ?? "claude"

/** The connected hub: reads the catalog of the area, words the three parts with the learner's progress and holds the tool picker. */
export const useHarnessHubScreen = (): HarnessHubScreen => {
    const locale = useLocale()
    const t = useTranslations("app.harness.hub")
    const common = useHarnessCommonLabels()
    const slotLabels = useSlotLabels()
    const read = useQueryHarnessHubSwr(locale)
    const { tool, choose } = useHarnessTool()
    useDocumentTitle(common.pageTitle)
    const slot = mapSlot(slotOfSwr(read), (hub): HarnessHubView => {
        const part = (key: HarnessPart): HarnessHubPartView | undefined => hub.find((each) => each.key === key)
        const build = part("build")
        const use = part("use")
        const rowOf = (each: HarnessHubPartView, progress: string, topics: string): HarnessPartRowView => ({
            id: each.key,
            title: each.title,
            description: each.summary,
            topics,
            progress,
            isDone: each.total > 0 && each.done === each.total,
            href: HARNESS_ROUTES[each.key],
        })
        return {
            figures: [
                { id: "builds", term: t("figures.builds"), value: `${build?.done ?? 0} / ${build?.total ?? 0}` },
                { id: "practising", term: t("figures.practising"), value: String(build?.practising ?? 0) },
                { id: "proved", term: t("figures.proved"), value: String(build?.proved ?? 0) },
                { id: "checks", term: t("figures.checks"), value: `${use?.done ?? 0} / ${use?.total ?? 0}` },
            ],
            parts: hub.map((each) =>
                rowOf(
                    each,
                    each.key === "docs"
                        ? t("parts.docs.progress", { count: each.total })
                        : t(`parts.${each.key}.progress`, { done: each.done, total: each.total }),
                    t(`parts.${each.key}.topics`),
                ),
            ),
        }
    })
    return {
        props: {
            header: harnessHeaderOf(common, { active: "overview", title: t("title"), description: t("description") }),
            slot,
            placeholder: {
                ...HARNESS_HUB_PLACEHOLDER,
                figures: (["builds", "practising", "proved", "checks"] as const).map((id) => ({
                    id,
                    term: t(`figures.${id}`),
                    value: "xx",
                })),
            },
            slotLabels: slotLabels(t("empty")),
            labels: {
                figuresLabel: t("figuresLabel"),
                partsTitle: t("partsTitle"),
                toolTitle: t("toolTitle"),
                toolDescription: t("toolDescription"),
                empty: t("empty"),
                open: t("open"),
            },
            common,
            tool,
            toolOptions: HARNESS_TOOLS.map((each) => ({ value: each, label: common.tools[each] })),
        },
        on: {
            retry: () => void read.mutate(),
            chooseTool: (value) => choose(toolOf(value)),
        },
    }
}
