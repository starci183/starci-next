"use client"

import { useReviewDeckScreen } from "@/hooks/reviewHub"
import { ReviewDeckBase } from "./component"

/** What the route hands the deck block: the deck in the address. */
type ReviewDeckProps = { readonly deckId: string }

/** The connected deck screen: reads one deck and hands the resolved screen to the presentational block. */
export const ReviewDeck = (props: ReviewDeckProps) => {
    const screen = useReviewDeckScreen(props.deckId)
    return <ReviewDeckBase props={screen.props} on={screen.on} />
}
