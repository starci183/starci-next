import type { useTranslations } from "next-intl"
import type { ProjectRead } from "@/hooks/swr"
import { projectMilestonePath } from "@/modules/routes"
import type { ChipView, ProjectDetailView } from "@/modules/types"

type Translate = ReturnType<typeof useTranslations>

/** The chip of a milestone by its state; a locked one says so. */
const milestoneChipOf = (t: Translate, milestone: ProjectRead["milestones"][number]): ChipView => {
    if (milestone.locked) return { label: t("detail.locked"), tone: "neutral" }
    const label = t(`detail.milestoneState.${milestone.state}`)
    if (milestone.state === "done") return { label, tone: "success" }
    return { label, tone: milestone.state === "in-progress" ? "accent" : "muted" }
}

/** The state chip of the whole project: proved when every concept is, practising when any result exists, else not started. */
const stateOf = (t: Translate, project: ProjectRead): ChipView => {
    if (project.conceptCount > 0 && project.provedConceptCount === project.conceptCount) {
        return { label: t("milestone.conceptState.proved"), tone: "success" }
    }
    if (project.provedConceptCount > 0 || project.practisingConceptCount > 0) {
        return { label: t("milestone.conceptState.practising"), tone: "accent" }
    }
    return { label: t("detail.milestoneState.todo"), tone: "muted" }
}

/** The verdict chip of a run. */
const verdictOf = (t: Translate, passed: boolean): ChipView =>
    passed ? { label: t("detail.ciPassed"), tone: "success" } : { label: t("detail.ciFailed"), tone: "warning" }

/** The words of a probe result: its name, the reason code in words and the facts the reason names. */
const probeWordsOf = (t: Translate, probe: ProjectRead["lastProbeRun"]): ProjectDetailView["probes"] =>
    (probe?.results ?? []).map((result) => {
        const reason = t(`reason.${result.reason}`, {
            ...Object.fromEntries(result.facts.map((fact) => [fact.key, fact.value])),
            placeholder: "{{message}}",
        })
        return {
            id: `${result.conceptId ?? "deployment"}:${result.probeId}`,
            chip: verdictOf(t, result.passed),
            text: `${result.probeId}: ${reason}`,
        }
    })

/** The latest runs: the signed CI run and the server probe run, each only when it exists. */
const runsOf = (t: Translate, project: ProjectRead): ProjectDetailView["runs"] => {
    const { lastCiRun: ci, lastProbeRun: probe } = project
    return [
        ...(ci === null
            ? []
            : [
                  {
                      id: `ci-${ci.runId}`,
                      kind: t("detail.runCi"),
                      detail: t("detail.ciRun", { runId: ci.runId, commit: ci.commit }),
                      verdict: verdictOf(t, ci.passed),
                      at: ci.at,
                  },
              ]),
        ...(probe === null
            ? []
            : [
                  {
                      id: `probe-${probe.runId}`,
                      kind: t("detail.runProbe"),
                      detail: probe.url,
                      verdict: verdictOf(t, probe.passed),
                      at: probe.at,
                  },
              ]),
    ]
}

/** The project as it is drawn, from the read. */
export const projectDetailViewOf = (t: Translate, project: ProjectRead): ProjectDetailView => {
    const ci = project.lastCiRun
    const repo = project.repoUrl === null ? "" : project.repoUrl.replace(/^https?:\/\//, "")
    return {
        title: project.name,
        meta: [repo, project.stack, project.language].filter((part) => part !== "").join(" · "),
        state: stateOf(t, project),
        repo: project.repoUrl ?? "",
        repoLabel: repo,
        milestones: project.milestones.map((milestone) => ({
            id: milestone.id,
            title: milestone.title,
            meta: t("detail.milestoneRow", { proved: milestone.provedCount, count: milestone.conceptCount }),
            percent:
                milestone.conceptCount === 0 ? 0 : Math.round((milestone.provedCount / milestone.conceptCount) * 100),
            chip: milestoneChipOf(t, milestone),
            href: projectMilestonePath(project.id, milestone.id),
        })),
        runs: runsOf(t, project),
        experience: [
            { id: "proved", title: t("detail.expProved"), count: project.provedConceptCount },
            { id: "practising", title: t("detail.expPractising"), count: project.practisingConceptCount },
            { id: "milestones", title: t("detail.expMilestones"), count: project.doneMilestoneCount },
        ],
        probes: probeWordsOf(t, project.lastProbeRun),
        ci:
            ci === null
                ? { label: t("detail.ciNotAttested"), tone: "muted" }
                : { label: t("detail.ciAttested"), tone: ci.passed ? "success" : "warning" },
        ciLine: ci === null ? t("detail.ciNone") : t("detail.ciRun", { runId: ci.runId, commit: ci.commit }),
        deployedUrl: project.deployedUrl ?? "",
    }
}
