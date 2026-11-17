"use client"

import { useLocale } from "next-intl"
import { useCallback, useState } from "react"
import { useMutatePracticeHintSwr } from "@/hooks/swr"
import type { PracticeHintView, PracticeProblemView } from "@/modules/types"
import { issueOf, type PracticeIssue } from "./practice.shared"

/** The hint ladder of one problem: the hints this learner opened and the command that opens the next. */
export type PracticeHintLadder = {
    readonly hints: ReadonlyArray<PracticeHintView>
    readonly isRevealing: boolean
    readonly issue: PracticeIssue
    readonly reveal: () => void
}

/** The hints of the ladder in order: the ones the read carries, then any opened since, one per step. */
const mergedHints = (
    read: ReadonlyArray<PracticeHintView>,
    added: ReadonlyArray<PracticeHintView>,
): ReadonlyArray<PracticeHintView> => {
    const steps = new Map<number, PracticeHintView>()
    for (const hint of [...read, ...added]) steps.set(hint.step, hint)
    return [...steps.values()].toSorted((a, b) => a.step - b.step)
}

/** The ladder of one problem; steps open in order, and the hint text comes from the data, never from a model. */
export const usePracticeHints = (slug: string, problem: PracticeProblemView | undefined): PracticeHintLadder => {
    const locale = useLocale()
    const { trigger, isMutating } = useMutatePracticeHintSwr()
    const [added, setAdded] = useState<ReadonlyArray<PracticeHintView>>([])
    const [issue, setIssue] = useState<PracticeIssue>("none")
    const hints = mergedHints(problem?.hintsRevealed ?? [], added)
    const next = hints.length + 1
    const reveal = useCallback(async (): Promise<void> => {
        setIssue("none")
        try {
            const opened = await trigger({ slug, step: next, locale })
            setAdded((current) => [...current, opened])
        } catch (error: unknown) {
            setIssue(issueOf(error))
        }
    }, [trigger, slug, next, locale])
    return { hints, isRevealing: isMutating, issue, reveal: () => void reveal() }
}
