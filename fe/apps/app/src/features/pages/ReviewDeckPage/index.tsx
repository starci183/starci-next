import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ReviewDeck } from "@/components/blocks/ReviewDeck"
import type { ReactElement } from "react"

/** What the route hands the deck page: the deck in the address. */
type ReviewDeckPageProps = { readonly deckId: string }

/** The document title of the deck page, from the catalog of the requested locale. */
export const reviewDeckMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.review.deck")
    return { title: t("pageTitle") }
}

/** The page of one deck: a server owner that mounts the block that reads it. */
export const ReviewDeckPage = (props: ReviewDeckPageProps): ReactElement => (
    <ReviewDeck key={props.deckId} deckId={props.deckId} />
)
