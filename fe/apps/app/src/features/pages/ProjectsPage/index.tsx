import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ProjectsList } from "@/components/blocks/ProjectsList"
import type { ReactElement } from "react"

/** The document title of the projects page, from the catalog of the requested locale. */
export const projectsMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.projects")
    return { title: t("pageTitle") }
}

/** The projects page: a server owner that mounts the block that reads and draws the learner's projects. */
export const ProjectsPage = (): ReactElement => <ProjectsList />
