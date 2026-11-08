"use client"

import { useReviewDecksView } from "@/hooks/reviewView"
import { APP_ROUTES } from "@/modules/routes"
import { REVIEW_DECKS_PLACEHOLDER, ReviewDecksBase } from "./component"

/** The connected deck screen: reads the decks and hands the resolved screen to its pure half. */
export const ReviewDecks = () => {
    const view = useReviewDecksView()
    return (
        <ReviewDecksBase
            props={{
                slot: view.slot,
                placeholder: REVIEW_DECKS_PLACEHOLDER,
                slotLabels: view.slotLabels,
                labels: view.labels,
                tracks: view.tracks,
                courses: view.courses,
                track: view.track,
                course: view.course,
                note: view.note,
                goal: view.goal,
                todayHref: APP_ROUTES.review,
            }}
            on={{
                retry: view.retry,
                setTrack: view.setTrack,
                setCourse: view.setCourse,
                toggle: view.toggle,
                setGoal: view.setGoal,
                saveGoal: view.saveGoal,
            }}
        />
    )
}
