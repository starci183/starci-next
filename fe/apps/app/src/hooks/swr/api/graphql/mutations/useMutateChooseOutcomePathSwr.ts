"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type ChooseOutcomePathMutation } from "@/modules/api"
import { mutateChooseOutcomePath } from "@/modules/api/graphql/mutations/mutation-choose-outcome-path"

/** Cache identity of the path choice. */
export const MUTATE_CHOOSE_OUTCOME_PATH_SWR_KEY = "MUTATE_CHOOSE_OUTCOME_PATH_SWR"

/** What one choice takes: the id of the path to follow. */
export interface ChooseOutcomePathArgument {
    readonly pathId: string
}

/** The extra argument SWR hands the fetcher. */
interface ChooseOutcomePathExtra {
    readonly arg: ChooseOutcomePathArgument
}

/** What the choice answers. */
export type ChooseOutcomePathResult = ChooseOutcomePathMutation["chooseOutcomePath"]

/** Sets the outcome path the learner follows. */
export const useMutateChooseOutcomePathSwr = (): SWRMutationResponse<
    ChooseOutcomePathResult,
    unknown,
    string,
    ChooseOutcomePathArgument
> =>
    useSWRMutation<ChooseOutcomePathResult, unknown, string, ChooseOutcomePathArgument>(
        MUTATE_CHOOSE_OUTCOME_PATH_SWR_KEY,
        async (_key: string, { arg }: ChooseOutcomePathExtra) => {
            const { data } = await failing(() => mutateChooseOutcomePath({ request: { pathId: arg.pathId } }))
            if (data === undefined) throw new Error("chooseOutcomePath answered no data")
            return data.chooseOutcomePath
        },
    )
