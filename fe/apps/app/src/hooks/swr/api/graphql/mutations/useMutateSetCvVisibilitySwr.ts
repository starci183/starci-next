"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type SetCvVisibilityMutation } from "@/modules/api"
import { mutateSetCvVisibility } from "@/modules/api/graphql/mutations/mutation-set-cv-visibility"

/** Cache identity of the CV visibility write. */
export const MUTATE_SET_CV_VISIBILITY_SWR_KEY = "MUTATE_SET_CV_VISIBILITY_SWR"

/** What one write takes: whether the combined CV link is public. */
export interface SetCvVisibilityArgument {
    readonly isPublic: boolean
}

/** The extra argument SWR hands the fetcher. */
interface SetCvVisibilityExtra {
    readonly arg: SetCvVisibilityArgument
}

/** What the write answers: the CV link as it stands now. */
export type SetCvVisibilityResult = SetCvVisibilityMutation["setCvVisibility"]

/** Makes the combined CV link public or private. */
export const useMutateSetCvVisibilitySwr = (): SWRMutationResponse<
    SetCvVisibilityResult,
    unknown,
    string,
    SetCvVisibilityArgument
> =>
    useSWRMutation<SetCvVisibilityResult, unknown, string, SetCvVisibilityArgument>(
        MUTATE_SET_CV_VISIBILITY_SWR_KEY,
        async (_key: string, { arg }: SetCvVisibilityExtra) => {
            const { data } = await failing(() => mutateSetCvVisibility({ request: arg }))
            if (data === undefined) throw new Error("setCvVisibility answered no data")
            return data.setCvVisibility
        },
    )
