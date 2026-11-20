import { PROBE_TONES, VERDICT_TONES, type HarnessCommonLabels } from "@/hooks/harness"
import { harnessGuidePath } from "@/modules/routes"
import type {
    HarnessDoctorView,
    HarnessGuideRowView,
    HarnessProbeView,
    HarnessTool,
    HarnessTrialView,
} from "@/modules/types"

/** The tone of a badge, as the grammar names it. */
export type HarnessUseTone = "success" | "danger" | "muted" | "accent" | "warning"

/** One guide of part 2 as a list row. */
export type HarnessGuideItemView = {
    readonly slug: string
    readonly title: string
    readonly summary: string
    readonly href: string
}

/** One local probe of `harness doctor` as a row, with the guide that fixes it when it fails. */
export type HarnessProbeItemView = {
    readonly id: string
    readonly title: string
    readonly detail: string
    readonly outcome: string
    readonly tone: HarnessUseTone
    readonly isFailing: boolean
    readonly fixLabel: string
    readonly fixHref: string
}

/** The newest `harness doctor` result of one tool, ready to draw. */
export type HarnessDoctorPanelView = {
    readonly command: string
    /** When the result arrived, in words; empty when the learner never ran it. */
    readonly ranAt: string
    /** How many probes passed out of those that ran, in words. */
    readonly summary: string
    readonly probes: ReadonlyArray<HarnessProbeItemView>
}

/** One trap of the trial panel as a table row. */
export type HarnessTrialItemView = {
    readonly id: string
    readonly title: string
    readonly summary: string
    readonly shortcuts: string
    readonly verdict: string
    readonly tone: HarnessUseTone
    readonly cost: string
    readonly command: string
}

/** The words the builders of this domain need, resolved by the hooks. */
export type HarnessUseWords = {
    readonly common: HarnessCommonLabels
    readonly probesSummary: (passed: number, ran: number) => string
    readonly fix: string
    readonly noShortcuts: string
    readonly never: string
    readonly shortcut: (label: string, isBlocked: boolean) => string
    readonly budget: (usd: number) => string
    readonly when: (iso: string) => string
}

/** The row of one guide. */
export const guideItemOf = (guide: HarnessGuideRowView): HarnessGuideItemView => ({
    slug: guide.slug,
    title: guide.title.replaceAll("`", ""),
    summary: guide.summary.replaceAll("`", ""),
    href: harnessGuidePath(guide.tool, guide.slug),
})

/** The row of one probe. */
const probeItemOf = (probe: HarnessProbeView, tool: HarnessTool, words: HarnessUseWords): HarnessProbeItemView => ({
    id: probe.id,
    title: probe.title,
    detail: probe.detail,
    outcome: words.common.probes[probe.outcome],
    tone: PROBE_TONES[probe.outcome],
    isFailing: probe.outcome === "fail",
    fixLabel: probe.outcome === "fail" && probe.guideSlug !== "" ? words.fix : "",
    fixHref: probe.outcome === "fail" && probe.guideSlug !== "" ? harnessGuidePath(tool, probe.guideSlug) : "",
})

/** The doctor panel of one tool: the command, when the newest result arrived and one row per probe. */
export const doctorPanelOf = (doctor: HarnessDoctorView, words: HarnessUseWords): HarnessDoctorPanelView => {
    const ran = doctor.probes.filter((probe) => probe.outcome !== "skipped")
    return {
        command: doctor.command,
        ranAt: doctor.ranAt === "" ? words.never : words.when(doctor.ranAt),
        summary: words.probesSummary(ran.filter((probe) => probe.outcome === "pass").length, ran.length),
        probes: doctor.probes.map((probe) => probeItemOf(probe, doctor.tool, words)),
    }
}

/** The row of one trap: the shortcuts the headless run observed, the verdict and the cost the CLI estimated. */
export const trialItemOf = (trial: HarnessTrialView, words: HarnessUseWords): HarnessTrialItemView => ({
    id: trial.id,
    title: trial.title,
    summary: trial.summary,
    shortcuts:
        trial.verdict === "untested"
            ? words.never
            : trial.shortcuts.length === 0
              ? words.noShortcuts
              : trial.shortcuts.map((each) => words.shortcut(each.label, each.isBlocked)).join(" · "),
    verdict: words.common.verdicts[trial.verdict],
    tone: VERDICT_TONES[trial.verdict],
    cost: trial.maxUsd > 0 ? words.budget(trial.maxUsd) : "",
    command: trial.command,
})
