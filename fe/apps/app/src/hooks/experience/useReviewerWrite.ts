"use client"

import type { ReviewerAdminOutcome } from "@starci-next/ui"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { failureCodeOf } from "./experience.shared"

/** The refusal codes the reviewer forms word; any other refusal reads as a failed save. */
const ADMIN_REFUSALS: ReadonlySet<string> = new Set([
    "CAREER_REVIEWER_NOT_FOUND",
    "CAREER_REVIEW_FORBIDDEN",
    "CAREER_SELF_REVIEW",
    "CAREER_STATE_CONFLICT",
])

/** One reviewer write in flight: whether it runs, what the last one did, and the runner. */
export interface ReviewerWrite {
    readonly isWorking: boolean
    readonly outcome: ReviewerAdminOutcome | undefined
    readonly run: (write: () => Promise<unknown>, done: string) => Promise<void>
}

/** Runs one reviewer write at a time, reloads the reads after it, and words a refusal from its stable code. */
export const useReviewerWrite = (reload: () => Promise<unknown>): ReviewerWrite => {
    const t = useTranslations("app.experience.queue")
    const [isWorking, setIsWorking] = useState(false)
    const [outcome, setOutcome] = useState<ReviewerAdminOutcome>()
    const run = async (write: () => Promise<unknown>, done: string): Promise<void> => {
        setIsWorking(true)
        try {
            await write()
            setOutcome({ text: done, tone: "affirmative" })
            await reload()
        } catch (error: unknown) {
            const code = failureCodeOf(error)
            setOutcome({ text: t(`refusal.${ADMIN_REFUSALS.has(code) ? code : "other"}`), tone: "negative" })
        } finally {
            setIsWorking(false)
        }
    }
    return { isWorking, outcome, run }
}
