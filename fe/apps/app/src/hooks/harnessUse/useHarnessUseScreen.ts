"use client"

import type { PageHeaderContent } from "@starci/grammar/common"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { harnessHeaderOf, useHarnessCommonLabels, useHarnessTool, type HarnessCommonLabels } from "@/hooks/harness"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryHarnessDoctorSwr, useQueryHarnessGuidesSwr, useQueryHarnessTrialsSwr } from "@/hooks/swr"
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

/** Part 2 of the harness area: three reads that wait and fail on their own. */
export type HarnessUseScreen = {
    readonly props: {
        readonly header: PageHeaderContent
        readonly guides: DataSlot<ReadonlyArray<HarnessGuideItemView>>
        readonly guidesPlaceholder: ReadonlyArray<HarnessGuideItemView>
        readonly doctor: DataSlot<HarnessDoctorPanelView>
        readonly doctorPlaceholder: HarnessDoctorPanelView
        readonly trials: DataSlot<ReadonlyArray<HarnessTrialItemView>>
        readonly trialsPlaceholder: ReadonlyArray<HarnessTrialItemView>
        readonly slotLabels: SlotLabels
        readonly labels: HarnessUseLabels
        readonly common: HarnessCommonLabels
        readonly tool: HarnessTool
        readonly toolOptions: ReadonlyArray<{ readonly value: string; readonly label: string }>
        readonly isOnlyFailing: boolean
    }
    readonly on: {
        readonly retryGuides: () => void
        readonly retryDoctor: () => void
        readonly retryTrials: () => void
        readonly chooseTool: (value: string) => void
        readonly setOnlyFailing: (isOnlyFailing: boolean) => void
    }
}

/** The same-shape guide list the skeleton draws while the first read runs. */
export const HARNESS_GUIDES_PLACEHOLDER: ReadonlyArray<HarnessGuideItemView> = [1, 2, 3].map((n) => ({
    slug: `g${n}`,
    title: "xxxxxxxxxxxxxxxx",
    summary: "xxxxxxxxxxxxxxxxxxxxxxxx",
    href: "/",
}))

/** The same-shape doctor panel the skeleton draws while the first read runs. */
export const HARNESS_DOCTOR_PLACEHOLDER: HarnessDoctorPanelView = {
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
}

/** The same-shape trial table the skeleton draws while the first read runs. */
export const HARNESS_TRIALS_PLACEHOLDER: ReadonlyArray<HarnessTrialItemView> = [1, 2].map((n) => ({
    id: `t${n}`,
    title: "xxxxxxxxxxxxxxxx",
    summary: "xxxxxxxxxxxxxxxxxxxxxxxx",
    shortcuts: "xxxxxxxxxx",
    verdict: "xxxxxx",
    tone: "muted",
    cost: "~ x",
    command: "xxxxxxxxxxxxxxxxxxxxxxxx",
}))

/** The tool a picker value names; anything else is the first tool. */
const toolOf = (value: string): HarnessTool => HARNESS_TOOLS.find((each) => each === value) ?? "claude"

/**
 * The connected part 2: the guides, the newest `harness doctor` result and the trials of the tool the learner picked, three reads
 * that the CLI's relayed results refresh every few seconds without a reload.
 */
export const useHarnessUseScreen = (): HarnessUseScreen => {
    const locale = useLocale()
    const t = useTranslations("app.harness.use")
    const format = useFormatter()
    const common = useHarnessCommonLabels()
    const slotLabels = useSlotLabels()
    const { tool, choose } = useHarnessTool()
    const guides = useQueryHarnessGuidesSwr(tool, locale)
    const doctor = useQueryHarnessDoctorSwr(tool, locale)
    const trials = useQueryHarnessTrialsSwr(tool, locale)
    const [isOnlyFailing, setOnlyFailing] = useState(false)
    useDocumentTitle(t("title"))
    const words: HarnessUseWords = {
        common,
        probesSummary: (passed, ran) => t("probesSummary", { passed, ran }),
        fix: t("fix"),
        noShortcuts: t("noShortcuts"),
        never: t("never"),
        shortcut: (label, isBlocked) => (isBlocked ? t("shortcutBlocked", { label }) : label),
        budget: (usd) => t("budget", { usd: format.number(usd, { style: "currency", currency: "USD" }) }),
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
            guides: mapSlot(slotOfSwr(guides), (rows) => rows.map((each) => guideItemOf(each))),
            guidesPlaceholder: HARNESS_GUIDES_PLACEHOLDER,
            doctor: mapSlot(slotOfSwr(doctor), (each) => doctorPanelOf(each, words)),
            doctorPlaceholder: HARNESS_DOCTOR_PLACEHOLDER,
            trials: mapSlot(slotOfSwr(trials), (rows) => rows.map((each) => trialItemOf(each, words))),
            trialsPlaceholder: HARNESS_TRIALS_PLACEHOLDER,
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
            retryGuides: () => void guides.mutate(),
            retryDoctor: () => void doctor.mutate(),
            retryTrials: () => void trials.mutate(),
            chooseTool: (value) => choose(toolOf(value)),
            setOnlyFailing,
        },
    }
}
