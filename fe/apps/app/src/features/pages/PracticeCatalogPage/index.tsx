import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { PracticeCatalog } from "@/components/blocks/PracticeCatalog"
import type { ReactElement } from "react"

/** The document title of the Practice code page, from the catalog of the requested locale. */
export const practiceCatalogMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.practice.catalog")
    return { title: t("pageTitle") }
}

/** The Practice code page: a server owner that mounts the block that reads and draws the patterns. */
export const PracticeCatalogPage = (): ReactElement => <PracticeCatalog />
