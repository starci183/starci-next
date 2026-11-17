import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ReviewQueue } from "@/components/blocks/ReviewQueue"
import type { ReactElement } from "react"

/** The document title of the page, from the catalog of the requested locale. */
export const reviewQueueMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.experience.queue")
    return { title: t("pageTitle") }
}

/** The review queue page (Experience review): a server owner that mounts the role-gated queue block. */
export const ReviewQueuePage = (): ReactElement => <ReviewQueue />
