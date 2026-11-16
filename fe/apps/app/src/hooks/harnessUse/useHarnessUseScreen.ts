"use client"

import type { PageHeaderContent } from "@starci/grammar/common"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { harnessHeaderOf, useHarnessCommonLabels, useHarnessTool, type HarnessCommonLabels } from "@/hooks/harness"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryHarnessCatalogSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { HARNESS_TOOLS, type DataSlot, type HarnessTool, type SlotLabels } from "@/modules/types"
import {
    doctorPanelOf,
    guideItemOf,
    trialItemOf,
    type HarnessDoctorPanelView,
    type HarnessGuideItemView,
    type HarnessTrialItemView,
    type HarnessUseWords,
} from "./harnessUse.shared"

/** Part 2 as drawn for one tool: its guides, the newest doctor result and the trials. */
export type HarnessUseView = {
    readonly guides: ReadonlyArray<HarnessGuideItemView>
    readonly doctor: HarnessDoctorPanelView
    readonly trials: ReadonlyArray<HarnessTrialItemView>
}

/** The words of part 2. */
export type HarnessUseLabels = {
    readonly guidesTitle: string
    readonly guidesEmpty: string
    readonly doctorTitle: string
    readonly doctorCommandLabel: string
    readonly doctorCommandDescription: string
    readonly doctorEmpty: string
    readonly onlyFailingLabel: string
    readonly onlyFailingDescription: string
    readonly trialsTitle: string
    readonly trialsEmpty: string
    readonly trapColumn: string
    readonly shortcutsColumn: string
    readonly verdictColumn: string
    readonly costColumn: string
    readonly trialCommand: string
    readonly toolDescription: string
}

/** Part 2 of the harness area. */
export type HarnessUseScreen = {
    readonly props: {
        readonly header: PageHeaderContent
        readonly slot: DataSlot<HarnessUseView>
        readonly placeholder: HarnessUseView
        readonly slotLabels: SlotLabels
        readonly labels: HarnessUseLabels
        readonly common: HarnessCommonLabels
        readonly tool: HarnessTool
        readonly toolOptions: ReadonlyArray<{ readonly value: string; readonly label: string }>
        readonly isOnlyFailing: boolean
    }
    readonly on: {
        readonly retry: () => void
        readonly chooseTool: (value: string) => void
        readonly setOnlyFailing: (isOnlyFailing: boolean) => void
    }
}

/** The same-shape part the skeleton draws while the first read runs. */
export const HARNESS_USE_PLACEHOLDER: HarnessUseView = {
    guides: [1, 2, 3].map((n) => ({
        slug: `g${n}`,
        title: "xxxxxxxxxxxxxxxx",
        summary: "xxxxxxxxxxxxxxxxxxxxxxxx",
        meta: "xx xxx",
        href: "/",
    })),
    doctor: {
        command: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        ranAt: "xxxxxxxxxx",
        summary: "x / x",
        probes: [1, 2, 3].map((n) => ({
            id: `p${n}`,
            title: "xxxxxxxxxxxxxxxxxxxx",
            detail: "xxxxxxxxxx",
            outcome: "xxxx",
            tone: "muted",
            isFailing: false,
            fixLabel: "",
            fixHref: "",
        })),
    },
    trials: [1, 2].map((n) => ({
        id: `t${n}`,
        title: "xxxxxxxxxxxxxxxx",
        summary: "xxxxxxxxxxxxxxxxxxxxxxxx",
        shortcuts: "xxxxxxxxxx",
        verdict: "xxxxxx",
        tone: "muted",
        cost: "~ $x",
        command: "xxxxxxxxxxxxxxxxxxxxxxxx",
    })),
}

/** The tool a picker value names; anything else is the first tool. */
const toolOf = (value: string): HarnessTool => HARNESS_TOOLS.find((each) => each === value) ?? "claude"

/**
 * The connected part 2: the guides of the tool the learner picked, the newest `harness doctor` result of that tool and the trials
 * with the shortcuts the headless runs observed. The catalog is read again every few seconds, so a doctor or a trial run in the
 * terminal shows up here without a reload.
 */
export const useHarnessUseScreen = (): HarnessUseScreen => {
    const locale = useLocale()
    const t = useTranslations("app.harness.use")
    const format = useFormatter()
    const common = useHarnessCommonLabels()
    const slotLabels = useSlotLabels()
    const read = useQueryHarnessCatalogSwr(locale)
    const { tool, choose } = useHarnessTool()
    const [isOnlyFailing, setOnlyFailing] = useState(false)
    useDocumentTitle(t("title"))
    const words: HarnessUseWords = {
        common,
        probesSummary: (passed, ran) => t("probesSummary", { passed, ran }),
        fix: t("fix"),
        noShortcuts: t("noShortcuts"),
        never: t("never"),
        shortcut: (label, count) => (count > 1 ? t("shortcutMany", { label, count }) : label),
        when: (iso) => format.dateTime(new Date(iso), { dateStyle: "medium", timeStyle: "short" }),
    }
    return {
        props: {
            header: harnessHeaderOf(common, {
                active: "use",
                title: t("title"),
                description: t("description"),
                trail: [],
            }),
            slot: mapSlot(slotOfSwr(read), (catalog): HarnessUseView => {
                const doctor = catalog.doctors.find((each) => each.tool === tool)
                return {
                    guides: catalog.guides.filter((each) => each.tool === tool).map((each) => guideItemOf(each, words)),
                    doctor: doctor === undefined ? HARNESS_USE_PLACEHOLDER.doctor : doctorPanelOf(doctor, words),
                    trials: catalog.trials.filter((each) => each.tool === tool).map((each) => trialItemOf(each, words)),
                }
            }),
            placeholder: HARNESS_USE_PLACEHOLDER,
            slotLabels: slotLabels(t("empty")),
            labels: {
                guidesTitle: t("guidesTitle"),
                guidesEmpty: t("guidesEmpty"),
                doctorTitle: t("doctorTitle"),
                doctorCommandLabel: t("doctorCommandLabel"),
                doctorCommandDescription: t("doctorCommandDescription"),
                doctorEmpty: t("doctorEmpty"),
                onlyFailingLabel: t("onlyFailingLabel"),
                onlyFailingDescription: t("onlyFailingDescription"),
                trialsTitle: t("trialsTitle"),
                trialsEmpty: t("trialsEmpty"),
                trapColumn: t("trapColumn"),
                shortcutsColumn: t("shortcutsColumn"),
                verdictColumn: t("verdictColumn"),
                costColumn: t("costColumn"),
                trialCommand: t("trialCommand"),
                toolDescription: t("toolDescription"),
            },
            common,
            tool,
            toolOptions: HARNESS_TOOLS.map((each) => ({ value: each, label: common.tools[each] })),
            isOnlyFailing,
        },
        on: {
            retry: () => void read.mutate(),
            chooseTool: (value) => choose(toolOf(value)),
            setOnlyFailing,
        },
    }
}
