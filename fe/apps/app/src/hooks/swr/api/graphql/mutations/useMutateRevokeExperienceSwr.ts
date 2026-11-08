"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { answeredData, failing, type RevokeExperienceInput, type RevokeExperienceMutation } from "@/modules/api"
import { mutateRevokeExperience } from "@/modules/api/graphql/mutations/mutation-revoke-experience"

/** What the write answers. */
export type RevokeExperienceResult = RevokeExperienceMutation["revokeExperience"]

/** Cache identity of the revokeExperience write. */
export const MUTATE_REVOKE_EXPERIENCE_SWR_KEY = "MUTATE_REVOKE_EXPERIENCE_SWR"

/** The extra argument SWR hands the fetcher. */
interface RevokeExperienceExtra {
    readonly arg: RevokeExperienceInput
}

/** Revokes a verified item with a reason. */
export const useMutateRevokeExperienceSwr = (): SWRMutationResponse<
    RevokeExperienceResult,
    unknown,
    string,
    RevokeExperienceInput
> =>
    useSWRMutation<RevokeExperienceResult, unknown, string, RevokeExperienceInput>(
        MUTATE_REVOKE_EXPERIENCE_SWR_KEY,
        async (_key: string, { arg }: RevokeExperienceExtra) =>
            (
                await answeredData(
                    failing(() => mutateRevokeExperience({ request: arg })),
                    "revokeExperience",
                )
            ).revokeExperience,
    )
