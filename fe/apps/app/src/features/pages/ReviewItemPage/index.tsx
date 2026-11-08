import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ReviewItem } from "@/components/blocks/ReviewItem"
import type { ReactElement } from "react"

/** What the route hands the page: the segment of the address. */
type ReviewItemPageProps = { readonly itemId: string }

/** The document title of the page, from the catalog of the requested locale. */
export const reviewItemMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.experience.queue")
    return { title: t("pageTitle") }
}

/** The page of one item under review: a server owner that hands the segment to the review block. */
export const ReviewItemPage = (props: ReviewItemPageProps): ReactElement => <ReviewItem itemId={props.itemId} />
