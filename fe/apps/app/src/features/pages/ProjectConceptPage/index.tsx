import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ProjectConcept } from "@/components/blocks/ProjectConcept"
import type { ReactElement } from "react"

/** What the route hands the concept page: the segments of the address. */
type ProjectConceptPageProps = {
    readonly projectId: string
    readonly milestoneId: string
    readonly conceptId: string
}

/** The document title of the concept evidence page, from the catalog of the requested locale. */
export const projectConceptMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.projects")
    return { title: t("pageTitle") }
}

/** The concept evidence page: a server owner that hands the segments to the block. */
export const ProjectConceptPage = (props: ProjectConceptPageProps): ReactElement => (
    <ProjectConcept projectId={props.projectId} milestoneId={props.milestoneId} conceptId={props.conceptId} />
)
