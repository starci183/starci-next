"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing } from "@/modules/api"
import { mutateRevealPracticeSolution } from "@/modules/api/graphql/mutations/mutation-reveal-practice-solution"
import type { PracticeSolutionView } from "@/modules/types"

/** Cache identity of the reveal-solution write. */
export const MUTATE_PRACTICE_SOLUTION_SWR_KEY = "MUTATE_PRACTICE_SOLUTION_SWR"

/** What one reveal takes: the problem and the language of the explanation. */
export interface PracticeSolutionArgument {
    readonly slug: string
    readonly locale: string
}

/** The extra argument SWR hands the reveal fetcher. */
interface PracticeSolutionExtra {
    readonly arg: PracticeSolutionArgument
}

/** Reveals the reference solution of a problem; the back end records that it was seen. */
export const useMutatePracticeSolutionSwr = (): SWRMutationResponse<
    PracticeSolutionView,
    unknown,
    string,
    PracticeSolutionArgument
> =>
    useSWRMutation<PracticeSolutionView, unknown, string, PracticeSolutionArgument>(
        MUTATE_PRACTICE_SOLUTION_SWR_KEY,
        async (_key: string, { arg }: PracticeSolutionExtra) => {
            const { data } = await failing(() => mutateRevealPracticeSolution({ request: arg }))
            if (data === undefined) throw new Error("revealPracticeSolution answered no data")
            return data.revealPracticeSolution
        },
    )
