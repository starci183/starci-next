"use client"

import type { PageHeaderContent } from "@starci/grammar/common"
import { useLocale, useTranslations } from "next-intl"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryHarnessCatalogSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { HARNESS_ROUTES } from "@/modules/routes"
import {
    HARNESS_PARTS,
    HARNESS_TOOLS,
    type DataSlot,
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
    readonly meta: string
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
    figures: [1, 2, 3, 4].map((n) => ({ id: `f${n}`, term: "xxxxxxxx", value: "xx", meta: "xxxxxxxx" })),
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
    const read = useQueryHarnessCatalogSwr(locale)
    const { tool, choose } = useHarnessTool()
    useDocumentTitle(common.pageTitle)
    const slot = mapSlot(slotOfSwr(read), (catalog): HarnessHubView => {
        const green = catalog.builds.filter((build) => build.stagesGreen === build.stagesTotal).length
        const stages = catalog.builds.reduce((sum, build) => sum + build.stagesGreen, 0)
        const stagesTotal = catalog.builds.reduce((sum, build) => sum + build.stagesTotal, 0)
        const probes = (catalog.doctors.find((doctor) => doctor.tool === tool)?.probes ?? []).filter(
            (probe) => probe.outcome !== "skipped",
        )
        const passed = probes.filter((probe) => probe.outcome === "pass").length
        const clean = catalog.trials.filter((trial) => trial.tool === tool && trial.verdict === "clean").length
        const trials = catalog.trials.filter((trial) => trial.tool === tool).length
        return {
            figures: [
                {
                    id: "builds",
                    term: t("figures.builds"),
                    value: `${green} / ${catalog.builds.length}`,
                    meta: t("figures.buildsMeta"),
                },
                {
                    id: "stages",
                    term: t("figures.stages"),
                    value: `${stages} / ${stagesTotal}`,
                    meta: t("figures.stagesMeta"),
                },
                {
                    id: "checks",
                    term: t("figures.checks"),
                    value: `${passed} / ${probes.length}`,
                    meta: common.tools[tool],
                },
                { id: "trials", term: t("figures.trials"), value: `${clean} / ${trials}`, meta: common.tools[tool] },
            ],
            parts: [
                {
                    id: "build",
                    title: t("parts.build.title"),
                    description: t("parts.build.description"),
                    topics: t("parts.build.topics"),
                    progress: t("parts.build.progress", { green, total: catalog.builds.length }),
                    isDone: green === catalog.builds.length && green > 0,
                    href: HARNESS_ROUTES.build,
                },
                {
                    id: "use",
                    title: t("parts.use.title"),
                    description: t("parts.use.description"),
                    topics: t("parts.use.topics"),
                    progress: t("parts.use.progress", { passed, total: probes.length }),
                    isDone: probes.length > 0 && passed === probes.length,
                    href: HARNESS_ROUTES.use,
                },
                {
                    id: "docs",
                    title: t("parts.docs.title"),
                    description: t("parts.docs.description"),
                    topics: t("parts.docs.topics"),
                    progress: t("parts.docs.progress", { count: catalog.docs.length }),
                    isDone: false,
                    href: HARNESS_ROUTES.docs,
                },
            ],
        }
    })
    return {
        props: {
            header: harnessHeaderOf(common, { active: "overview", title: t("title"), description: t("description") }),
            slot,
            placeholder: HARNESS_HUB_PLACEHOLDER,
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
