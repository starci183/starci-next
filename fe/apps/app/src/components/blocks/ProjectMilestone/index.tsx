"use client"

import { useFormatter, useLocale, useTranslations } from "next-intl"
import { projectMilestoneViewOf, useProjectMilestoneLabels } from "@/hooks/projectMilestone"
import { isProjectMissing, isProjectPremiumRequired } from "@/hooks/projects"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryProjectMilestoneSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { staticsBase } from "@/modules/config"
import { projectConceptPath } from "@/modules/routes"
import { PROJECT_MILESTONE_PLACEHOLDER, ProjectMilestoneBase } from "./component"

/** What the route hands the milestone block: the segments of the address. */
type ProjectMilestoneProps = { readonly projectId: string; readonly milestoneId: string }

/** The connected milestone screen: the concept list with its proof, the evidence runs, and the forms that point at code and ask the AI teacher. */
export const ProjectMilestone = (props: ProjectMilestoneProps) => {
    const t = useTranslations("app.projects")
    const format = useFormatter()
    const read = useQueryProjectMilestoneSwr({
        projectId: props.projectId,
        milestoneId: props.milestoneId,
        locale: useLocale(),
    })
    const labels = useProjectMilestoneLabels(props.projectId)
    useDocumentTitle(read.data === undefined ? undefined : `${read.data.milestone.title} · ${t("pageTitle")}`)
    return (
        <ProjectMilestoneBase
            props={{
                slot: mapSlot(slotOfSwr(read), (milestone) => projectMilestoneViewOf(t, format, milestone)),
                placeholder: PROJECT_MILESTONE_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("empty")),
                isNotFound: isProjectMissing(read.error),
                isLocked: isProjectPremiumRequired(read.error),
                labels,
                table: {
                    legend: t("milestone.legend"),
                    noLesson: t("milestone.noLesson"),
                    columns: { state: t("milestone.col.state"), lesson: t("milestone.col.lesson") },
                },
                staticsBaseUrl: staticsBase(),
                tally: {
                    proved: t("milestone.conceptState.proved"),
                    practising: t("milestone.conceptState.practising"),
                    todo: t("milestone.conceptState.todo"),
                    ring: t("milestone.conceptsLabel"),
                },
                conceptHrefs: Object.fromEntries(
                    (read.data?.concepts ?? []).map((concept) => [
                        concept.id,
                        projectConceptPath(props.projectId, props.milestoneId, concept.id),
                    ]),
                ),
            }}
            on={{ retry: () => void read.mutate() }}
        />
    )
}
