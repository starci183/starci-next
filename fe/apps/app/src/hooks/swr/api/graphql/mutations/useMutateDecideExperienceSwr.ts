"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { answeredData, failing, type DecideExperienceInput, type DecideExperienceMutation } from "@/modules/api"
import { mutateDecideExperience } from "@/modules/api/graphql/mutations/mutation-decide-experience"

/** What the write answers. */
export type DecideExperienceResult = DecideExperienceMutation["decideExperience"]

/** Cache identity of the decideExperience write. */
export const MUTATE_DECIDE_EXPERIENCE_SWR_KEY = "MUTATE_DECIDE_EXPERIENCE_SWR"

/** The extra argument SWR hands the fetcher. */
interface DecideExperienceExtra {
    readonly arg: DecideExperienceInput
}

/** Approves or returns pending items; each result carries its state or its refusal code. */
export const useMutateDecideExperienceSwr = (): SWRMutationResponse<
    DecideExperienceResult,
    unknown,
    string,
    DecideExperienceInput
> =>
    useSWRMutation<DecideExperienceResult, unknown, string, DecideExperienceInput>(
        MUTATE_DECIDE_EXPERIENCE_SWR_KEY,
        async (_key: string, { arg }: DecideExperienceExtra) =>
            (
                await answeredData(
                    failing(() => mutateDecideExperience({ request: arg })),
                    "decideExperience",
                )
            ).decideExperience,
    )
