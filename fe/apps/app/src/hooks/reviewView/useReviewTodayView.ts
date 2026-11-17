"use client"

import { useLocale } from "next-intl"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryReviewTodaySwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import type { DataSlot, ReviewTodayLabels, ReviewTodayScreen, SlotLabels } from "@/modules/types"
import { todayScreenOf } from "./reviewView.shared"
import { todayLabelsOf, useReviewWords } from "@/hooks/review"

/** What the connected screen of today's review hands its pure half. */
export type ReviewTodayViewState = {
    readonly slot: DataSlot<ReviewTodayScreen>
    readonly slotLabels: SlotLabels
    readonly labels: ReviewTodayLabels
    readonly retry: () => void
}

/** Reads the queue of today and words it. */
export const useReviewTodayView = (): ReviewTodayViewState => {
    const words = useReviewWords()
    const read = useQueryReviewTodaySwr(useLocale())
    const slotLabels = useSlotLabels()(words.t("today.emptyTitle"))
    useDocumentTitle(words.t("today.pageTitle"))
    return {
        slot: mapSlot(slotOfSwr(read), (today) => todayScreenOf(today, words)),
        slotLabels,
        labels: todayLabelsOf(words.t),
        retry: () => void read.mutate(),
    }
}
