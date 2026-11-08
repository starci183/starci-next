"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing } from "@/modules/api"
import { mutateRevealPracticeHint } from "@/modules/api/graphql/mutations/mutation-reveal-practice-hint"
import type { PracticeHintView } from "@/modules/types"

/** Cache identity of the reveal-hint write. */
export const MUTATE_PRACTICE_HINT_SWR_KEY = "MUTATE_PRACTICE_HINT_SWR"

/** What one reveal takes: the problem, the step of the ladder (1 to 3) and the language of the hint. */
export interface PracticeHintArgument {
    readonly slug: string
    readonly step: number
    readonly locale: string
}

/** The extra argument SWR hands the reveal fetcher. */
interface PracticeHintExtra {
    readonly arg: PracticeHintArgument
}

/** Reveals the next hint of a problem on demand; the hint text comes from the data, never from a model. */
export const useMutatePracticeHintSwr = (): SWRMutationResponse<
    PracticeHintView,
    unknown,
    string,
    PracticeHintArgument
> =>
    useSWRMutation<PracticeHintView, unknown, string, PracticeHintArgument>(
        MUTATE_PRACTICE_HINT_SWR_KEY,
        async (_key: string, { arg }: PracticeHintExtra) => {
            const { data } = await failing(() => mutateRevealPracticeHint({ request: arg }))
            if (data === undefined) throw new Error("revealPracticeHint answered no data")
            return data.revealPracticeHint
        },
    )
