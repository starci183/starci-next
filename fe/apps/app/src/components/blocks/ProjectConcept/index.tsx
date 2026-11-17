"use client"

import { useFormatter, useLocale, useTranslations } from "next-intl"
import { projectConceptViewOf, useConceptEvidenceExtras, useProjectConceptLabels } from "@/hooks/projectConcept"
import { issueWordsOf } from "@/hooks/projectMilestone"
import { isProjectMissing, useConceptForms, useProjectActions, type ProjectIssue } from "@/hooks/projects"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryProjectMilestoneSwr, useQueryProjectSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { PROJECT_CONCEPT_PLACEHOLDER, ProjectConceptBase } from "./component"

type Translate = ReturnType<typeof useTranslations>

/** The words of the refusal of the last probe run; empty for none. */
const probeWordsOf = (t: Translate, issue: ProjectIssue): string => {
    const key: Readonly<Partial<Record<ProjectIssue, string>>> = {
        targetRefused: "detail.error.targetRefused",
        deployedMissing: "detail.error.deployedMissing",
        rateLimited: "detail.error.rateLimited",
    }
    const found = key[issue]
    return found === undefined ? "" : t(found)
}

/** What the route hands the concept block: the segments of the address. */
type ProjectConceptProps = {
    readonly projectId: string
    readonly milestoneId: string
    readonly conceptId: string
}

/** The connected evidence page of one concept: the milestone read for its slots, the project read for the last runs, and its commands. */
export const ProjectConcept = (props: ProjectConceptProps) => {
    const t = useTranslations("app.projects")
    const format = useFormatter()
    const locale = useLocale()
    const milestone = useQueryProjectMilestoneSwr({
        projectId: props.projectId,
        milestoneId: props.milestoneId,
        locale,
    })
    const project = useQueryProjectSwr({ projectId: props.projectId, locale })
    const refresh = (): void => {
        void milestone.mutate()
        void project.mutate()
    }
    const forms = useConceptForms(props.projectId, refresh)
    const actions = useProjectActions(props.projectId, refresh)
    const labels = useProjectConceptLabels(props.projectId, props.milestoneId)
    const extras = useConceptEvidenceExtras({ projectId: props.projectId, conceptId: props.conceptId })
    const view =
        milestone.data === undefined
            ? undefined
            : projectConceptViewOf(t, format, milestone.data, project.data, props.conceptId, extras)
    useDocumentTitle(view === undefined ? undefined : `${view.concept.label} · ${t("pageTitle")}`)
    const settled = mapSlot(slotOfSwr(milestone), () => view ?? PROJECT_CONCEPT_PLACEHOLDER)
    const issueWords = issueWordsOf(t, forms.issue) || probeWordsOf(t, actions.issue)
    return (
        <ProjectConceptBase
            props={{
                slot: settled,
                placeholder: PROJECT_CONCEPT_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("empty")),
                labels,
                isNotFound: isProjectMissing(milestone.error) || (milestone.data !== undefined && view === undefined),
                draft: forms.draftOf(props.conceptId),
                isBusy: forms.pendingId === props.conceptId,
                isProbing: actions.isProbing,
                issueWords,
            }}
            on={{
                retry: refresh,
                write: (key, value) => forms.write(props.conceptId, key, value),
                savePointer: () => forms.savePointer(props.conceptId),
                explain: () => forms.explain(props.conceptId),
                runProbes: actions.runProbes,
            }}
        />
    )
}
