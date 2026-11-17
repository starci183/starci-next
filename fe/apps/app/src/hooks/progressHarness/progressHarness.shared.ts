import type { ListRowData } from "@starci/grammar/common"
import type { LearnerProgress } from "@/hooks/swr"
import type { ProgressBlockView } from "@/modules/types"
import {
    HARNESS_ROUTE,
    proofBadgeOf,
    type ProgressBadge,
    type ProgressFormatter,
    type ProgressTone,
    type ProgressTranslate,
} from "@/hooks/progressWords"

type Harness = NonNullable<LearnerProgress["harness"]>
type Doctor = Harness["doctor"][number]
type Trial = Harness["trials"][number]

/** The names of the tools the harness checks. */
const toolNamesOf = (t: ProgressTranslate): Record<string, string> => ({
    claude: t("harness.tool.claude"),
    codex: t("harness.tool.codex"),
})

/** The chip of a doctor verdict. */
const doctorBadgeOf = (t: ProgressTranslate, doctor: Doctor): ProgressBadge => {
    if (doctor.verdict === "passed") return { label: t("harness.proved"), tone: "success", isDot: true }
    if (doctor.verdict === "failed") return { label: t("harness.doctorFailedBadge"), tone: "danger", isDot: true }
    return { label: t("harness.doctorNotRun"), tone: "muted", isDot: true }
}

/** The line under a doctor row: how many probes passed. */
const doctorLineOf = (t: ProgressTranslate, doctor: Doctor): string => {
    if (doctor.verdict === "failed") return t("harness.doctorFailed", { passed: doctor.passed, total: doctor.total })
    if (doctor.verdict === "passed") return t("harness.doctorPassed", { passed: doctor.passed, total: doctor.total })
    return t("harness.doctorNotRun")
}

const TRIAL_TONES: Readonly<Record<string, ProgressTone>> = {
    held: "success",
    breached: "danger",
    incomplete: "warning",
}

/** The chip of the newest trial of a trap. */
const trialBadgeOf = (t: ProgressTranslate, trial: Trial): ProgressBadge => {
    const words: Record<string, string> = {
        held: t("harness.held"),
        breached: t("harness.breached"),
        incomplete: t("harness.incomplete"),
    }
    if (trial.verdict === null) return { label: t("harness.never"), tone: "muted", isDot: true }
    return { label: words[trial.verdict] ?? trial.verdict, tone: TRIAL_TONES[trial.verdict] ?? "muted", isDot: true }
}

/** The line under a trial row: the tool and when it ran, or that it was never tried. */
const trialLineOf = (t: ProgressTranslate, format: ProgressFormatter, trial: Trial): string => {
    if (trial.tool === null || trial.at === null) return t("harness.never")
    const tool = toolNamesOf(t)[trial.tool] ?? trial.tool
    return t("harness.trialLine", { tool, when: format.relativeTime(new Date(trial.at)) })
}

/** The rows of the builds with their stage counts. */
const buildRowsOf = (t: ProgressTranslate, builds: Harness["builds"]): ReadonlyArray<ListRowData> =>
    builds.map((build): ListRowData => ({
        id: build.buildId,
        title: build.title,
        description: t("harness.build", {
            proved: build.stagesProved,
            total: build.stagesTotal,
            practising: build.stagesPractising,
        }),
        badges: [proofBadgeOf(t, build.state)],
    }))

/** The Harness part: the builds with their stages, the doctor verdict of each tool and the newest trial of each trap. */
export const harnessOf = (
    t: ProgressTranslate,
    format: ProgressFormatter,
    data: LearnerProgress["harness"],
): ProgressBlockView | null => {
    if (data === null) return null
    const tools = toolNamesOf(t)
    return {
        lists: [
            {
                id: "harness-builds",
                title: t("harness.title"),
                fact: t("harness.fact", { done: data.buildsDone, total: data.buildsTotal }),
                link: { label: t("harness.open"), href: HARNESS_ROUTE },
                rows: buildRowsOf(t, data.builds),
                empty: t("harness.empty"),
            },
            {
                id: "harness-doctor",
                title: t("harness.doctorTitle"),
                rows: data.doctor.map((doctor): ListRowData => ({
                    id: doctor.tool,
                    title: tools[doctor.tool] ?? doctor.tool,
                    description: doctorLineOf(t, doctor),
                    badges: [doctorBadgeOf(t, doctor)],
                })),
                empty: t("harness.empty"),
            },
            {
                id: "harness-trials",
                title: t("harness.trialsTitle"),
                rows: data.trials.map((trial): ListRowData => ({
                    id: trial.trap,
                    title: trial.title,
                    description: trialLineOf(t, format, trial),
                    badges: [trialBadgeOf(t, trial)],
                })),
                empty: t("harness.empty"),
            },
        ],
    }
}
