import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ProjectDetail } from "@/components/blocks/ProjectDetail"
import type { ReactElement } from "react"

/** What the route hands the project page: the segment of the address. */
type ProjectPageProps = { readonly projectId: string }

/** The document title of the project page, from the catalog of the requested locale. */
export const projectMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.projects")
    return { title: t("pageTitle") }
}

/** The project page: a server owner that hands the segment to the block that reads and draws the project. */
export const ProjectPage = (props: ProjectPageProps): ReactElement => <ProjectDetail projectId={props.projectId} />
