"use client"

import { useReviewHubScreen } from "@/hooks/reviewHub"
import { ReviewTodayBase } from "./component"

/** The connected hub of Ôn tập: reads the day and hands the resolved screen to the presentational block. */
export const ReviewToday = () => {
    const screen = useReviewHubScreen()
    return <ReviewTodayBase props={screen.props} on={screen.on} />
}
