"use client"

import { useState } from "react"
import { useLocale } from "next-intl"
import { useMutateRequestLessonRunSwr, useMutateRevealLessonHintSwr } from "@/hooks/swr"

/** What the learner asks of the machine and of the lesson on Scenarios. */
export type RunCommands = {
    /** Asks the online machine to run one scenario; the result comes back over the relay. */
    readonly run: (scenarioId: string, guardsOff: ReadonlyArray<string>) => void
    /** Opens the hint of a scenario before its first red run (the lesson then counts as done with help). */
    readonly revealHint: (scenarioId: string) => void
    /** The hints the learner asked for in this visit, by scenario id. */
    readonly revealed: Readonly<Record<string, string>>
    readonly isRequesting: boolean
    /** True when the last request did not reach the machine. */
    readonly hasFailed: boolean
}

/** The writes of Scenarios: a run request to the machine and a hint reveal, each a typed outcome the page renders. */
export const useRunCommands = (lessonId: string, afterRun: () => void): RunCommands => {
    const locale = useLocale()
    const request = useMutateRequestLessonRunSwr()
    const reveal = useMutateRevealLessonHintSwr()
    const [revealed, setRevealed] = useState<Readonly<Record<string, string>>>({})
    return {
        run: (scenarioId, guardsOff) => {
            if (lessonId === "") return
            void request.trigger({ lessonId, scenarioId, guardsOff }, { throwOnError: false }).then(afterRun)
        },
        revealHint: (scenarioId) => {
            if (lessonId === "") return
            void reveal.trigger({ lessonId, scenarioId, locale }, { throwOnError: false }).then((result) => {
                if (result !== undefined) setRevealed((all) => ({ ...all, [result.scenarioId]: result.hint }))
            })
        },
        revealed,
        isRequesting: request.isMutating,
        hasFailed: request.error !== undefined,
    }
}
