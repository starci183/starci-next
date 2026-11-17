"use client"

import { useCallback, useState } from "react"
import { useMutatePracticeRunSwr, useMutatePracticeSubmitSwr, useQueryPracticeSubmissionSwr } from "@/hooks/swr"
import { isUnsettled } from "@/modules/practice-result"
import type { PracticeProblemView, PracticeSubmissionView } from "@/modules/types"
import { usePracticeDraft, type PracticeDraft } from "./usePracticeDraft"
import { usePracticeHints, type PracticeHintLadder } from "./usePracticeHints"
import { issueOf, type PracticeIssue } from "./practice.shared"

/** What the solve screen holds and does: the editor, the last run with the judge's answer, the hint ladder and their issues. */
export type PracticeWork = {
    readonly draft: PracticeDraft
    readonly hints: PracticeHintLadder
    readonly submission: PracticeSubmissionView | undefined
    /** True from the press of run or submit until the first answer arrives. */
    readonly isStarting: boolean
    /** True while the judge is still on the last run or submission. */
    readonly isBusy: boolean
    readonly issue: PracticeIssue
    readonly run: () => void
    readonly submit: () => void
}

/**
 * The work of one learner on one problem: the draft per language, the run and the submission (the door waits for the judge a
 * while, then the answer is polled until it settles) and the hint ladder. A rejected call becomes an issue the screen words by
 * its stable code.
 */
export const usePracticeSolve = (slug: string, problem: PracticeProblemView | undefined): PracticeWork => {
    const draft = usePracticeDraft(slug, problem)
    const hints = usePracticeHints(slug, problem)
    const { trigger: triggerRun, isMutating: isRunning } = useMutatePracticeRunSwr()
    const { trigger: triggerSubmit, isMutating: isSubmitting } = useMutatePracticeSubmitSwr()
    const [submissionId, setSubmissionId] = useState<string | undefined>(undefined)
    const [issue, setIssue] = useState<PracticeIssue>("none")
    const polled = useQueryPracticeSubmissionSwr(submissionId)
    const send = useCallback(
        async (kind: "run" | "submit"): Promise<void> => {
            setIssue("none")
            try {
                const trigger = kind === "run" ? triggerRun : triggerSubmit
                const queued = await trigger({ slug, language: draft.language, source: draft.code })
                setSubmissionId(queued.id)
            } catch (error: unknown) {
                setIssue(issueOf(error))
            }
        },
        [triggerRun, triggerSubmit, slug, draft.language, draft.code],
    )
    const isStarting = isRunning || isSubmitting
    return {
        draft,
        hints,
        submission: polled.data,
        isStarting,
        isBusy: isStarting || isUnsettled(polled.data),
        issue,
        run: () => void send("run"),
        submit: () => void send("submit"),
    }
}
