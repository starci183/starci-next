import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { CourseCatalog } from "@/components/blocks/CourseCatalog"
import type { ReactElement } from "react"

/** The document title of the Essentials catalog, from the catalog of the requested locale. */
export const courseCatalogPageMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.courseCatalog")
    return { title: t("pageTitle") }
}

/** The Essentials page: a server owner that mounts the catalog block. */
export const CourseCatalogPage = (): ReactElement => <CourseCatalog />
