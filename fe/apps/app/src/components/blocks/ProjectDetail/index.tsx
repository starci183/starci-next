"use client"

import { useLocale, useTranslations } from "next-intl"
import { isProjectMissing, useProjectActions, type ProjectIssue } from "@/hooks/projects"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryProjectSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { PROJECT_DETAIL_PLACEHOLDER, ProjectDetailBase } from "./component"
import { labelsOf } from "./labels"
import { viewOf } from "./view"

type Translate = ReturnType<typeof useTranslations>

/** The words of the refusal of the last command; empty for none. */
const issueWordsOf = (t: Translate, issue: ProjectIssue): string => {
    switch (issue) {
        case "none":
            return ""
        case "targetRefused":
            return t("detail.error.targetRefused")
        case "deployedMissing":
            return t("detail.error.deployedMissing")
        case "rateLimited":
            return t("detail.error.rateLimited")
        case "premiumRequired":
        case "invalid":
        case "excerptCredential":
        case "limit":
        case "notReady":
        case "invalidLocation":
        case "invalidExplanation":
        case "invalidEndpoint":
        case "coach":
        case "other":
            return t("detail.error.other")
    }
}

/** What the route hands the project block: the segment of the address. */
type ProjectDetailProps = { readonly projectId: string }

/** The connected project screen: reads the project and its proof, and runs the commands of practice, proof and the CI secret. */
export const ProjectDetail = (props: ProjectDetailProps) => {
    const t = useTranslations("app.projects")
    const locale = useLocale()
    const read = useQueryProjectSwr({ projectId: props.projectId, locale })
    const actions = useProjectActions(props.projectId, () => void read.mutate())
    useDocumentTitle(read.data === undefined ? undefined : `${read.data.name} · ${t("pageTitle")}`)
    return (
        <ProjectDetailBase
            props={{
                slot: mapSlot(slotOfSwr(read), (project) => viewOf(t, project)),
                placeholder: PROJECT_DETAIL_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("empty")),
                isNotFound: isProjectMissing(read.error),
                fields: {
                    deployed: actions.deployedDraft ?? read.data?.deployedUrl ?? "",
                    secret: actions.secret,
                    issueWords: issueWordsOf(t, actions.issue),
                    locale,
                },
                busy: {
                    isSaving: actions.isSaving,
                    isProbing: actions.isProbing,
                    isSyncing: actions.isSyncing,
                    isRotating: actions.isRotating,
                },
                labels: labelsOf(t),
            }}
            on={{
                retry: () => void read.mutate(),
                deployed: actions.setDeployedDraft,
                saveDeployed: actions.saveDeployed,
                runProbes: actions.runProbes,
                sync: actions.sync,
                rotate: actions.rotate,
            }}
        />
    )
}
