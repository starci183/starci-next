import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { HarnessHub } from "@/components/blocks/HarnessHub"
import type { ReactElement } from "react"

/** The document title of the harness hub page, from the catalog of the requested locale. */
export const harnessHubPageMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.harness.hub")
    return { title: t("title") }
}

/** The harness hub page: a server owner that mounts the block that reads and draws it. */
export const HarnessHubPage = (): ReactElement => <HarnessHub />
