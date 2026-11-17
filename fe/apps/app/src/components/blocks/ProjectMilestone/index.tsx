"use client"

import { useFormatter, useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { issueWordsOf, projectMilestoneViewOf, useProjectMilestoneLabels } from "@/hooks/projectMilestone"
import { isProjectMissing, isProjectPremiumRequired, useConceptForms } from "@/hooks/projects"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryProjectMilestoneSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { PROJECT_MILESTONE_PLACEHOLDER, ProjectMilestoneBase } from "./component"

/** What the route hands the milestone block: the segments of the address. */
type ProjectMilestoneProps = { readonly projectId: string; readonly milestoneId: string }

/** The connected milestone screen: the concept list with its proof, the evidence runs, and the forms that point at code and ask the AI teacher. */
export const ProjectMilestone = (props: ProjectMilestoneProps) => {
    const t = useTranslations("app.projects")
    const format = useFormatter()
    const [openId, setOpenId] = useState<string | undefined>(undefined)
    const read = useQueryProjectMilestoneSwr({
        projectId: props.projectId,
        milestoneId: props.milestoneId,
        locale: useLocale(),
    })
    const labels = useProjectMilestoneLabels(props.projectId)
    const forms = useConceptForms(props.projectId, () => void read.mutate())
    useDocumentTitle(read.data === undefined ? undefined : `${read.data.milestone.title} · ${t("pageTitle")}`)
    return (
        <ProjectMilestoneBase
            props={{
                slot: mapSlot(slotOfSwr(read), (milestone) => projectMilestoneViewOf(t, format, milestone)),
                placeholder: PROJECT_MILESTONE_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("empty")),
                isNotFound: isProjectMissing(read.error),
                isLocked: isProjectPremiumRequired(read.error),
                drafts: Object.fromEntries(
                    (read.data?.concepts ?? []).map((concept) => [concept.id, forms.draftOf(concept.id)]),
                ),
                pendingId: forms.pendingId,
                issueId: forms.issueId,
                issueWords: issueWordsOf(t, forms.issue),
                openId,
                labels,
            }}
            on={{
                retry: () => void read.mutate(),
                write: forms.write,
                savePointer: forms.savePointer,
                explain: forms.explain,
                open: setOpenId,
            }}
        />
    )
}
