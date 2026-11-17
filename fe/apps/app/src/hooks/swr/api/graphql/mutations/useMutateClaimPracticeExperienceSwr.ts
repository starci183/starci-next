"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type ClaimPracticeExperienceMutation } from "@/modules/api"
import { mutateClaimPracticeExperience } from "@/modules/api/graphql/mutations/mutation-claim-practice-experience"

/** Cache identity of the practice experience claim. */
export const MUTATE_CLAIM_PRACTICE_EXPERIENCE_SWR_KEY = "MUTATE_CLAIM_PRACTICE_EXPERIENCE_SWR"

/** What one claim takes: the pattern whose problems are all Accepted. */
export interface ClaimPracticeExperienceArgument {
    readonly patternId: string
}

/** The extra argument SWR hands the fetcher. */
interface ClaimPracticeExperienceExtra {
    readonly arg: ClaimPracticeExperienceArgument
}

/** What the claim answers: the item it opened or found. */
export type ClaimPracticeExperienceResult = ClaimPracticeExperienceMutation["claimPracticeExperience"]

/** Claims the experience item of one fully Accepted pattern. */
export const useMutateClaimPracticeExperienceSwr = (): SWRMutationResponse<
    ClaimPracticeExperienceResult,
    unknown,
    string,
    ClaimPracticeExperienceArgument
> =>
    useSWRMutation<ClaimPracticeExperienceResult, unknown, string, ClaimPracticeExperienceArgument>(
        MUTATE_CLAIM_PRACTICE_EXPERIENCE_SWR_KEY,
        async (_key: string, { arg }: ClaimPracticeExperienceExtra) => {
            const { data } = await failing(() => mutateClaimPracticeExperience({ request: arg }))
            if (data === undefined) throw new Error("claimPracticeExperience answered no data")
            return data.claimPracticeExperience
        },
    )
