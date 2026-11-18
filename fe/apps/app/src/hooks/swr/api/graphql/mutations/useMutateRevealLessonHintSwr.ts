"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing } from "@/modules/api"
import { mutateRevealLessonHint } from "@/modules/api/graphql/mutations/mutation-reveal-lesson-hint"

/** Cache identity of the reveal-lesson-hint write. */
export const MUTATE_REVEAL_LESSON_HINT_SWR_KEY = "MUTATE_REVEAL_LESSON_HINT_SWR"

/** What one reveal takes: the lesson, the scenario and the language of the hint. */
export interface RevealLessonHintArgument {
    readonly lessonId: string
    readonly scenarioId: string
    readonly locale: string
}

/** The hint the back end released for the scenario. */
export interface LessonHintRevealed {
    readonly scenarioId: string
    readonly hint: string
}

/** Opens the hint of a scenario on demand; the hint text comes from the lesson, never from a model. */
export const useMutateRevealLessonHintSwr = (): SWRMutationResponse<
    LessonHintRevealed,
    unknown,
    string,
    RevealLessonHintArgument
> =>
    useSWRMutation<LessonHintRevealed, unknown, string, RevealLessonHintArgument>(
        MUTATE_REVEAL_LESSON_HINT_SWR_KEY,
        async (_key: string, { arg }: { readonly arg: RevealLessonHintArgument }) => {
            const { data } = await failing(() => mutateRevealLessonHint({ request: arg }))
            if (data === undefined) throw new Error("revealLessonHint answered no data")
            return data.revealLessonHint
        },
    )
