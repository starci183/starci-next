import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { PathsChoose } from "@/components/blocks/PathsChoose"
import type { ReactElement } from "react"

/** The document title of the goal screen, from the catalog of the requested locale. */
export const pathsChooseMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.paths")
    return { title: t("pageTitle") }
}

/** The goal page: a server owner that mounts the block that reads the outcome paths and saves the choice. */
export const PathsChoosePage = (): ReactElement => <PathsChoose />
