import { PROBE_TONES, VERDICT_TONES, type HarnessCommonLabels } from "@/hooks/harness"
import { harnessGuidePath } from "@/modules/routes"
import type { HarnessDoctorView, HarnessGuideRowView, HarnessProbeView, HarnessTrialView } from "@/modules/types"

/** The tone of a badge, as the grammar names it. */
export type HarnessUseTone = "success" | "danger" | "muted" | "accent"

/** One guide of part 2 as a list row. */
export type HarnessGuideItemView = {
    readonly slug: string
    readonly title: string
    readonly summary: string
    readonly meta: string
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
    readonly shortcut: (label: string, count: number) => string
    readonly when: (iso: string) => string
}

/** The row of one guide. */
export const guideItemOf = (guide: HarnessGuideRowView, words: HarnessUseWords): HarnessGuideItemView => ({
    slug: guide.slug,
    title: guide.title,
    summary: guide.summary,
    meta: words.common.minutes(guide.minutes),
    href: harnessGuidePath(guide.slug),
})

/** The row of one probe. */
const probeItemOf = (probe: HarnessProbeView, words: HarnessUseWords): HarnessProbeItemView => ({
    id: probe.id,
    title: probe.title,
    detail: probe.detail,
    outcome: words.common.probes[probe.outcome],
    tone: PROBE_TONES[probe.outcome],
    isFailing: probe.outcome === "fail",
    fixLabel: probe.outcome === "fail" && probe.guideSlug !== "" ? words.fix : "",
    fixHref: probe.outcome === "fail" && probe.guideSlug !== "" ? harnessGuidePath(probe.guideSlug) : "",
})

/** The doctor panel of one tool; `only` limits it to the probes a guide fixes, when that guide fixes any. */
export const doctorPanelOf = (
    doctor: HarnessDoctorView,
    words: HarnessUseWords,
    only?: string,
): HarnessDoctorPanelView => {
    const own = only === undefined ? [] : doctor.probes.filter((probe) => probe.guideSlug === only)
    const probes = own.length > 0 ? own : doctor.probes
    const ran = probes.filter((probe) => probe.outcome !== "skipped")
    return {
        command: doctor.command,
        ranAt: doctor.ranAt === "" ? words.never : words.when(doctor.ranAt),
        summary: words.probesSummary(ran.filter((probe) => probe.outcome === "pass").length, ran.length),
        probes: probes.map((probe) => probeItemOf(probe, words)),
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
              : trial.shortcuts.map((each) => words.shortcut(each.label, each.count)).join(" · "),
    verdict: words.common.verdicts[trial.verdict],
    tone: VERDICT_TONES[trial.verdict],
    cost: trial.cost,
    command: trial.command,
})
