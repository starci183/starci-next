"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import {
    answeredData,
    failing,
    type SetExperienceReviewerInput,
    type SetExperienceReviewerMutation,
} from "@/modules/api"
import { mutateSetExperienceReviewer } from "@/modules/api/graphql/mutations/mutation-set-experience-reviewer"

/** What the write answers. */
export type SetExperienceReviewerResult = SetExperienceReviewerMutation["setExperienceReviewer"]

/** Cache identity of the setExperienceReviewer write. */
export const MUTATE_SET_EXPERIENCE_REVIEWER_SWR_KEY = "MUTATE_SET_EXPERIENCE_REVIEWER_SWR"

/** The extra argument SWR hands the fetcher. */
interface SetExperienceReviewerExtra {
    readonly arg: SetExperienceReviewerInput
}

/** Appoints, rescopes or ends a reviewer (the teacher only). */
export const useMutateSetExperienceReviewerSwr = (): SWRMutationResponse<
    SetExperienceReviewerResult,
    unknown,
    string,
    SetExperienceReviewerInput
> =>
    useSWRMutation<SetExperienceReviewerResult, unknown, string, SetExperienceReviewerInput>(
        MUTATE_SET_EXPERIENCE_REVIEWER_SWR_KEY,
        async (_key: string, { arg }: SetExperienceReviewerExtra) =>
            (
                await answeredData(
                    failing(() => mutateSetExperienceReviewer({ request: arg })),
                    "setExperienceReviewer",
                )
            ).setExperienceReviewer,
    )
