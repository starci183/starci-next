import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ProgressOverview } from "@/components/blocks/ProgressOverview"
import type { ReactElement } from "react"

/** The document title of the page, from the catalog of the requested locale. */
export const progressMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.progress")
    return { title: t("pageTitle") }
}

/** The progress page (Progress): a server owner that mounts the progress overview block. */
export const ProgressPage = (): ReactElement => <ProgressOverview />
