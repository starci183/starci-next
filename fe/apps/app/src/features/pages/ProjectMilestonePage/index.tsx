import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ProjectMilestone } from "@/components/blocks/ProjectMilestone"
import type { ReactElement } from "react"

/** What the route hands the milestone page: the segments of the address. */
type ProjectMilestonePageProps = { readonly projectId: string; readonly milestoneId: string }

/** The document title of the milestone page, from the catalog of the requested locale. */
export const projectMilestoneMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.projects")
    return { title: t("pageTitle") }
}

/** The milestone page: a server owner that hands the segments to the block that reads and draws the checklist. */
export const ProjectMilestonePage = (props: ProjectMilestonePageProps): ReactElement => (
    <ProjectMilestone projectId={props.projectId} milestoneId={props.milestoneId} />
)
