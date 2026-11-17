import type { useFormatter, useTranslations } from "next-intl"
import { conceptCardOf } from "@/hooks/projectMilestone"
import type { ProjectMilestoneRead, ProjectRead } from "@/hooks/swr"
import type { ConceptEvidenceExtras } from "./useConceptEvidenceExtras"
import type { CiRunView, ConceptProbeLine, ProjectConceptView } from "@/modules/types"

type Translate = ReturnType<typeof useTranslations>
type Formatter = ReturnType<typeof useFormatter>

/** The probe log of one concept: the results of the latest probe run that name it, as passed or failed lines in words. */
const probeLinesOf = (
    t: Translate,
    project: ProjectRead | undefined,
    conceptId: string,
): ReadonlyArray<ConceptProbeLine> =>
    (project?.lastProbeRun?.results ?? [])
        .filter((result) => result.conceptId === conceptId)
        .map((result) => {
            const reason = t(`reason.${result.reason}`, {
                ...Object.fromEntries(result.facts.map((fact) => [fact.key, fact.value])),
                placeholder: "{{message}}",
            })
            return { id: result.probeId, passed: result.passed, text: `${result.probeId}: ${reason}` }
        })

/** The latest signed CI run of the project in words, or undefined when none ran. */
const ciOf = (t: Translate, format: Formatter, project: ProjectRead | undefined): CiRunView | undefined => {
    const run = project?.lastCiRun
    if (run === undefined || run === null) return undefined
    return {
        run: run.runId,
        commit: run.commit,
        verdictLabel: t(run.passed ? "detail.ciPassed" : "detail.ciFailed"),
        verdictTone: run.passed ? "success" : "warning",
        when: format.relativeTime(new Date(run.at)),
    }
}

/**
 * The evidence page of one concept, from the milestone read that holds it, the project read that holds the last runs, and the extras
 * of the evidence door (the code-read rubric and the CV line). Undefined when the milestone does not list the concept.
 */
export const projectConceptViewOf = (
    t: Translate,
    format: Formatter,
    milestone: ProjectMilestoneRead,
    project: ProjectRead | undefined,
    conceptId: string,
    extras: ConceptEvidenceExtras,
): ProjectConceptView | undefined => {
    const concept = milestone.concepts.find((each) => each.id === conceptId)
    if (concept === undefined) return undefined
    return {
        concept: conceptCardOf(t, concept),
        projectName: milestone.project.name,
        milestoneTitle: milestone.milestone.title,
        deployedUrl: milestone.project.deployedUrl ?? "",
        probeLines: probeLinesOf(t, project, conceptId),
        ci: ciOf(t, format, project),
        rubric: extras.rubric,
        cv: extras.cv,
    }
}
