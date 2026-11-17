import type { LearnerProgress } from "@/hooks/swr"
import { HARNESS_ROUTES } from "@/modules/routes"
import type { ProgressBlockView, ProgressRowView } from "@/modules/types"
import { proofBadgeOf, type ProgressBadge, type ProgressTranslate } from "@/hooks/progressWords"

type Harness = NonNullable<LearnerProgress["harness"]>
type Doctor = Harness["doctor"][number]

/** The names of the tools the harness checks. */
const toolNamesOf = (t: ProgressTranslate): Record<string, string> => ({
    claude: t("harness.tool.claude"),
    codex: t("harness.tool.codex"),
})

/** The chip of a doctor verdict. */
const doctorBadgeOf = (t: ProgressTranslate, doctor: Doctor): ProgressBadge => {
    if (doctor.verdict === "passed") return { label: t("harness.proved"), tone: "success", isDot: true }
    if (doctor.verdict === "failed") return { label: t("harness.incomplete"), tone: "warning", isDot: true }
    return { label: t("harness.doctorNotRun"), tone: "muted", isDot: true }
}

/** The line under a doctor row: how many probes passed. */
const doctorLineOf = (t: ProgressTranslate, doctor: Doctor): string => {
    if (doctor.verdict === "failed") return t("harness.doctorFailed", { passed: doctor.passed, total: doctor.total })
    if (doctor.verdict === "passed") return t("harness.doctorPassed", { passed: doctor.passed, total: doctor.total })
    return t("harness.doctorNotRun")
}

/** The rows of the builds with their stage counts. */
const buildRowsOf = (t: ProgressTranslate, builds: Harness["builds"]): ReadonlyArray<ProgressRowView> =>
    builds.map((build): ProgressRowView => ({
        id: build.buildId,
        title: build.title,
        description: t("harness.build", {
            proved: build.stagesProved,
            total: build.stagesTotal,
            practising: build.stagesPractising,
        }),
        badges: [proofBadgeOf(t, build.state)],
    }))

/** The rows of the doctor of each tool: how many checks passed, and whether the tool is proved. */
const doctorRowsOf = (t: ProgressTranslate, doctors: Harness["doctor"]): ReadonlyArray<ProgressRowView> => {
    const tools = toolNamesOf(t)
    return doctors.map((doctor): ProgressRowView => ({
        id: `doctor-${doctor.tool}`,
        title: `${t("harness.doctorTitle")} · ${tools[doctor.tool] ?? doctor.tool}`,
        description: doctorLineOf(t, doctor),
        badges: [doctorBadgeOf(t, doctor)],
    }))
}

/** The Harness part: the builds with their stages, then the doctor verdict of each tool, in one list. */
export const harnessOf = (t: ProgressTranslate, data: LearnerProgress["harness"]): ProgressBlockView | null => {
    if (data === null) return null
    return {
        lists: [
            {
                id: "harness-builds",
                title: t("harness.title"),
                link: { label: t("harness.open"), href: HARNESS_ROUTES.hub },
                rows: [...buildRowsOf(t, data.builds), ...doctorRowsOf(t, data.doctor)],
                empty: t("harness.empty"),
            },
        ],
    }
}
