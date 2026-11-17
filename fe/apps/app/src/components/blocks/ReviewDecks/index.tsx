"use client"

import { useReviewDecksScreen } from "@/hooks/reviewHub"
import { ReviewDecksBase } from "./component"

/** The connected decks screen: reads the decks and hands the resolved screen to the presentational block. */
export const ReviewDecks = () => {
    const screen = useReviewDecksScreen()
    return <ReviewDecksBase props={screen.props} on={screen.on} />
}
