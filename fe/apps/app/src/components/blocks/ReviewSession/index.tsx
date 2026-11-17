"use client"

import { useReviewSessionView } from "@/hooks/reviewView"
import { APP_ROUTES } from "@/modules/routes"
import { REVIEW_SESSION_PLACEHOLDER, ReviewSessionBase } from "./component"

/** The connected review session: walks the queue of today and hands the resolved screen to its pure half. */
export const ReviewSession = () => {
    const view = useReviewSessionView()
    return (
        <ReviewSessionBase
            props={{
                slot: view.slot,
                placeholder: REVIEW_SESSION_PLACEHOLDER,
                slotLabels: view.slotLabels,
                percent: view.percent,
                labels: view.labels,
                todayHref: APP_ROUTES.review,
                hubHref: APP_ROUTES.home,
                plansHref: APP_ROUTES.premium,
            }}
            on={{
                setNote: view.setNote,
                pick: view.pick,
                flip: view.flip,
                submitAnswer: view.submitAnswer,
                grade: view.grade,
                skip: view.skip,
                retry: view.retry,
            }}
        />
    )
}
