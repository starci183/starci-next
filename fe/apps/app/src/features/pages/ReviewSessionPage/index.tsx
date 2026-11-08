import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import type { ReactElement } from "react"
import { ReviewSession } from "@/components/blocks/ReviewSession"

/** The document title of the page, from the catalog of the requested locale. */
export const reviewSessionMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.review.session")
    return { title: t("pageTitle") }
}

/** The page: a server owner that mounts the block that reads and draws the screen. */
export const ReviewSessionPage = (): ReactElement => <ReviewSession />
