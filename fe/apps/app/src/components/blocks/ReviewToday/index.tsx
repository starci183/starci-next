"use client"

import { useReviewTodayView } from "@/hooks/reviewView"
import { APP_ROUTES } from "@/modules/routes"
import { REVIEW_TODAY_PLACEHOLDER, ReviewTodayBase } from "./component"

/** The connected screen of today's review: reads the queue and hands the resolved screen to its pure half. */
export const ReviewToday = () => {
    const view = useReviewTodayView()
    return (
        <ReviewTodayBase
            props={{
                slot: view.slot,
                placeholder: REVIEW_TODAY_PLACEHOLDER,
                slotLabels: view.slotLabels,
                labels: view.labels,
                sessionHref: APP_ROUTES.reviewSession,
                decksHref: APP_ROUTES.reviewDecks,
                essentialsHref: APP_ROUTES.essentials,
                plansHref: APP_ROUTES.premium,
                hubHref: APP_ROUTES.home,
            }}
            on={{ retry: view.retry }}
        />
    )
}
