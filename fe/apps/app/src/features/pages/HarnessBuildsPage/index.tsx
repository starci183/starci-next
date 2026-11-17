import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { HarnessBuilds } from "@/components/blocks/HarnessBuilds"
import type { ReactElement } from "react"

/** The document title of the list of builds page, from the catalog of the requested locale. */
export const harnessBuildsPageMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.harness.builds")
    return { title: t("title") }
}

/** The list of builds page: a server owner that mounts the block that reads and draws it. */
export const HarnessBuildsPage = (): ReactElement => <HarnessBuilds />
