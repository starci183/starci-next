"use client"

import type { PageHeaderContent } from "@starci/grammar/common"
import { navigation } from "@starci-next/i18n/navigation"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import {
    harnessHeaderOf,
    outlineOf,
    useHarnessCommonLabels,
    useHarnessTool,
    type HarnessCommonLabels,
} from "@/hooks/harness"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryHarnessGuideSwr, useQueryHarnessGuidesSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { doctorCommandOf } from "@/modules/harness-view"
import { HARNESS_ROUTES, harnessGuidePath } from "@/modules/routes"
import {
    HARNESS_TOOLS,
    type DataSlot,
    type HarnessOutlineEntry,
    type HarnessSectionView,
    type HarnessTool,
    type SlotLabels,
} from "@/modules/types"
import { doctorPanelOf, type HarnessDoctorPanelView, type HarnessUseWords } from "./harnessUse.shared"
import { HARNESS_DOCTOR_PLACEHOLDER } from "./useHarnessUseScreen"

/** One guide as drawn: its sections, its outline and the tool it is written for. */
export type HarnessGuidePageView = {
    readonly title: string
    readonly summary: string
    readonly tool: HarnessTool
    readonly sections: ReadonlyArray<HarnessSectionView>
    readonly outline: ReadonlyArray<HarnessOutlineEntry>
    /** The newest `harness doctor` result of the guide's tool, read with the guide. */
    readonly doctor: HarnessDoctorPanelView
}

/** One guide of the list beside the one on screen. */
export type HarnessGuideNavItem = {
    readonly id: string
    readonly title: string
    readonly href: string
    readonly isCurrent: boolean
}

/** The words of the guide page. */
export type HarnessGuideLabels = {
    readonly navTitle: string
    readonly navEmpty: string
    readonly outlineTitle: string
    readonly outlineEmpty: string
    readonly toolDescription: string
    readonly doctorTitle: string
    readonly doctorCommandLabel: string
    readonly doctorCommandDescription: string
    readonly doctorEmpty: string
    readonly doctorOnlyFailingLabel: string
    readonly doctorOnlyFailingDescription: string
}

/** The guide page. */
export type HarnessGuideScreen = {
    readonly props: {
        readonly header: PageHeaderContent
        readonly guide: DataSlot<HarnessGuidePageView>
        readonly guidePlaceholder: HarnessGuidePageView
        readonly guides: ReadonlyArray<HarnessGuideNavItem>
        readonly slotLabels: SlotLabels
        readonly labels: HarnessGuideLabels
        readonly common: HarnessCommonLabels
        readonly toolOptions: ReadonlyArray<{ readonly value: string; readonly label: string }>
        readonly isOnlyFailing: boolean
    }
    readonly on: {
        readonly retryGuide: () => void
        readonly chooseTool: (value: string) => void
        readonly setOnlyFailing: (isOnlyFailing: boolean) => void
    }
}

/** The same-shape guide the skeleton draws while the first read runs. */
export const HARNESS_GUIDE_PLACEHOLDER: HarnessGuidePageView = {
    title: "xxxxxxxxxxxxxxxx",
    summary: "xxxxxxxxxxxxxxxxxxxxxxxx",
    tool: "claude",
    sections: [1, 2].map((n) => ({
        id: `s${n}`,
        title: "xxxxxxxxxxxxxxxx",
        markdown: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    })),
    outline: [1, 2, 3].map((n) => ({ id: `o${n}`, label: "xxxxxxxxxxxxxxxx", href: `#o${n}` })),
    doctor: HARNESS_DOCTOR_PLACEHOLDER,
}

/** What the route hands the guide page: the tool and the guide in the address. */
type GuideRoute = { readonly tool: string; readonly slug: string }

/** The tool a picker value names; anything else is the first tool. */
const toolOf = (value: string): HarnessTool => HARNESS_TOOLS.find((each) => each === value) ?? "claude"

/**
 * The connected guide page: reads the guide and cuts its markdown into anchored sections with an outline, reads the newest
 * `harness doctor` result of the guide's tool for the panel, and moves to the same guide of the other tool when the learner
 * switches the tool (and remembers the pick).
 */
export const useHarnessGuideScreen = (route: GuideRoute): HarnessGuideScreen => {
    const locale = useLocale()
    const t = useTranslations("app.harness.guide")
    const format = useFormatter()
    const router = navigation.useRouter()
    const common = useHarnessCommonLabels()
    const slotLabels = useSlotLabels()
    const tool = toolOf(route.tool)
    const other: HarnessTool = tool === "claude" ? "codex" : "claude"
    const guide = useQueryHarnessGuideSwr(tool, route.slug, locale)
    const own = useQueryHarnessGuidesSwr(tool, locale)
    const twins = useQueryHarnessGuidesSwr(other, locale)
    const { choose } = useHarnessTool()
    const [isOnlyFailing, setOnlyFailing] = useState(false)
    useDocumentTitle(guide.data?.title)
    const words: HarnessUseWords = {
        common,
        probesSummary: (passed, ran) => t("probesSummary", { passed, ran }),
        fix: t("fix"),
        noShortcuts: "",
        never: t("never"),
        shortcut: (label) => label,
        budget: () => "",
        when: (iso) => format.dateTime(new Date(iso), { dateStyle: "medium", timeStyle: "short" }),
    }
    return {
        props: {
            header: harnessHeaderOf(common, {
                active: "use",
                title: guide.data?.title ?? t("title"),
                ...(guide.data === undefined ? {} : { description: guide.data.summary }),
                trail: [[common.tabs.use, HARNESS_ROUTES.use]],
            }),
            guide: mapSlot(slotOfSwr(guide), (each): HarnessGuidePageView => {
                const probes = each?.probes ?? []
                const ranAt = probes.reduce((newest, probe) => (probe.at > newest ? probe.at : newest), "")
                return {
                    title: each?.title ?? "",
                    summary: each?.summary ?? "",
                    tool: each?.tool ?? tool,
                    sections: each?.sections ?? [],
                    outline: outlineOf(each?.sections ?? []),
                    doctor: doctorPanelOf({ tool, command: doctorCommandOf(tool), ranAt, probes }, words),
                }
            }),
            guidePlaceholder: HARNESS_GUIDE_PLACEHOLDER,
            guides: (own.data ?? []).map((each) => ({
                id: each.slug,
                title: each.title,
                href: harnessGuidePath(tool, each.slug),
                isCurrent: each.slug === route.slug,
            })),
            slotLabels: slotLabels(t("missing")),
            labels: {
                navTitle: t("navTitle"),
                navEmpty: t("navEmpty"),
                outlineTitle: t("outlineTitle"),
                outlineEmpty: t("outlineEmpty"),
                toolDescription: t("toolDescription"),
                doctorTitle: t("doctorTitle"),
                doctorCommandLabel: t("doctorCommandLabel"),
                doctorCommandDescription: t("doctorCommandDescription"),
                doctorEmpty: t("doctorEmpty"),
                doctorOnlyFailingLabel: t("onlyFailingLabel"),
                doctorOnlyFailingDescription: t("onlyFailingDescription"),
            },
            common,
            toolOptions: HARNESS_TOOLS.map((each) => ({ value: each, label: common.tools[each] })),
            isOnlyFailing,
        },
        on: {
            retryGuide: () => void guide.mutate(),
            chooseTool: (value) => {
                const next = toolOf(value)
                choose(next)
                if (next === tool) return
                const index = (own.data ?? []).findIndex((each) => each.slug === route.slug)
                const twin = (twins.data ?? [])[index]
                router.push(twin === undefined ? HARNESS_ROUTES.use : harnessGuidePath(next, twin.slug))
            },
            setOnlyFailing,
        },
    }
}
