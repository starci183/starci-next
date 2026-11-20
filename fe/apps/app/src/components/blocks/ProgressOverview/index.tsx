"use client"

import { useSlotLabels } from "@/hooks/slot"
import { useProgressView } from "@/hooks/progress"
import { useDocumentTitle } from "@/hooks/title"
import { staticsBase } from "@/modules/config"
import { PROGRESS_PLACEHOLDER, ProgressOverviewBase } from "./component"

/** The connected progress page: one read across the app, worded in the reader's language. */
export const ProgressOverview = () => {
    const page = useProgressView()
    const slotLabels = useSlotLabels()
    useDocumentTitle(page.pageTitle)
    return (
        <ProgressOverviewBase
            props={{
                slot: page.slot,
                placeholder: PROGRESS_PLACEHOLDER,
                slotLabels: { ...slotLabels(page.labels.unavailable), error: page.labels.pageError },
                labels: page.labels,
                staticsBaseUrl: staticsBase(),
            }}
            on={{ retry: page.retry }}
        />
    )
}
