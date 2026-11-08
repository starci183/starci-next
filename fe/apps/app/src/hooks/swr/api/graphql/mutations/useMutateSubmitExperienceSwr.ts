"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { answeredData, failing, type SubmitExperienceInput, type SubmitExperienceMutation } from "@/modules/api"
import { mutateSubmitExperience } from "@/modules/api/graphql/mutations/mutation-submit-experience"

/** What the write answers. */
export type SubmitExperienceResult = SubmitExperienceMutation["submitExperience"]

/** Cache identity of the submitExperience write. */
export const MUTATE_SUBMIT_EXPERIENCE_SWR_KEY = "MUTATE_SUBMIT_EXPERIENCE_SWR"

/** The extra argument SWR hands the fetcher. */
interface SubmitExperienceExtra {
    readonly arg: SubmitExperienceInput
}

/** Sends an item to pending review; the trigger rejects with the typed failure. */
export const useMutateSubmitExperienceSwr = (): SWRMutationResponse<
    SubmitExperienceResult,
    unknown,
    string,
    SubmitExperienceInput
> =>
    useSWRMutation<SubmitExperienceResult, unknown, string, SubmitExperienceInput>(
        MUTATE_SUBMIT_EXPERIENCE_SWR_KEY,
        async (_key: string, { arg }: SubmitExperienceExtra) =>
            (
                await answeredData(
                    failing(() => mutateSubmitExperience({ request: arg })),
                    "submitExperience",
                )
            ).submitExperience,
    )
