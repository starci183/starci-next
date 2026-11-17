"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import { useMutateDecideExperienceSwr, useMutateRevokeExperienceSwr } from "@/hooks/swr"
import type { ReviewOutcomeView } from "@/modules/types"
import { REVIEW_REFUSALS, failureCodeOf } from "./experience.shared"

/** The decision a signer is writing on one item: the note, whether a write runs, what the last one did, and the commands. */
export interface ReviewDecision {
    readonly note: string
    readonly isWorking: boolean
    readonly outcome: ReviewOutcomeView | undefined
    readonly editNote: (text: string) => void
    readonly approve: () => void
    readonly giveBack: () => void
    readonly revoke: () => void
    readonly clear: () => void
}

/**
 * Holds the signer's note and runs Verify, Return with a note and Revoke on the item `itemId` names, then reloads the reads.
 * A refusal is worded from its stable code (the per-item refusal of a batch, or the code of a failed door), never its status.
 */
export const useReviewDecision = (itemId: string | undefined, reload: () => Promise<unknown>): ReviewDecision => {
    const t = useTranslations("app.experience.queue")
    const decide = useMutateDecideExperienceSwr()
    const revokeWrite = useMutateRevokeExperienceSwr()
    const [note, setNote] = useState("")
    const [isWorking, setIsWorking] = useState(false)
    const [outcome, setOutcome] = useState<ReviewOutcomeView>()
    const refused = (code: string): void =>
        setOutcome({ text: t(`refusal.${REVIEW_REFUSALS.has(code) ? code : "other"}`), tone: "negative" })
    const run = async (write: () => Promise<string | null>, done: ReviewOutcomeView): Promise<void> => {
        setIsWorking(true)
        try {
            const refusal = await write()
            if (refusal === null) {
                setOutcome(done)
                setNote("")
            } else refused(refusal)
            await reload()
        } catch (error: unknown) {
            refused(failureCodeOf(error))
        } finally {
            setIsWorking(false)
        }
    }
    const verdict = (kind: "approve" | "return"): void => {
        if (itemId === undefined) return
        const done: ReviewOutcomeView =
            kind === "approve"
                ? { text: t("approved"), tone: "affirmative" }
                : { text: t("returned"), tone: "cautionary" }
        const decisions = [{ itemId, verdict: kind, note: note.trim() === "" ? null : note }]
        void run(async () => (await decide.trigger({ decisions }))[0]?.refusal ?? null, done)
    }
    return {
        note,
        isWorking,
        outcome,
        editNote: setNote,
        approve: () => verdict("approve"),
        giveBack: () => verdict("return"),
        revoke: () => {
            if (itemId === undefined) return
            void run(
                async () => {
                    await revokeWrite.trigger({ itemId, reason: note })
                    return null
                },
                { text: t("revoked"), tone: "cautionary" },
            )
        },
        clear: () => setOutcome(undefined),
    }
}
