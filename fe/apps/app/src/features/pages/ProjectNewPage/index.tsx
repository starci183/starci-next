import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ProjectNew } from "@/components/blocks/ProjectNew"
import type { ReactElement } from "react"

/** The document title of the new-project page, from the catalog of the requested locale. */
export const projectNewMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.projects")
    return { title: t("new.title") }
}

/** The new-project page: a server owner that mounts the block with the form. */
export const ProjectNewPage = (): ReactElement => <ProjectNew />
