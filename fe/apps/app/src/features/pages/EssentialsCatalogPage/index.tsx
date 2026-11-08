import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { EssentialsCatalog } from "@/components/blocks/EssentialsCatalog"
import type { ReactElement } from "react"

/** The document title of the catalog page, from the catalog of the requested locale. */
export const essentialsCatalogMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.essentials.catalog")
    return { title: t("title") }
}

/** The Knowledge Lesson catalog page: a server owner that mounts the block that reads and draws the lessons. */
export const EssentialsCatalogPage = (): ReactElement => <EssentialsCatalog />
