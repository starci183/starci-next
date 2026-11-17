import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { HarnessDocs } from "@/components/blocks/HarnessDocs"
import type { ReactElement } from "react"

/** The document title of the list of articles page, from the catalog of the requested locale. */
export const harnessDocsPageMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.harness.docs")
    return { title: t("title") }
}

/** The list of articles page: a server owner that mounts the block that reads and draws it. */
export const HarnessDocsPage = (): ReactElement => <HarnessDocs />
