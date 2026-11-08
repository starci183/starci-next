"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { answeredData, failing, type AssignExperienceInput, type AssignExperienceMutation } from "@/modules/api"
import { mutateAssignExperience } from "@/modules/api/graphql/mutations/mutation-assign-experience"

/** What the write answers. */
export type AssignExperienceResult = AssignExperienceMutation["assignExperience"]

/** Cache identity of the assignExperience write. */
export const MUTATE_ASSIGN_EXPERIENCE_SWR_KEY = "MUTATE_ASSIGN_EXPERIENCE_SWR"

/** The extra argument SWR hands the fetcher. */
interface AssignExperienceExtra {
    readonly arg: AssignExperienceInput
}

/** Assigns a pending item to a reviewer, or back to the teacher's queue (the teacher only). */
export const useMutateAssignExperienceSwr = (): SWRMutationResponse<
    AssignExperienceResult,
    unknown,
    string,
    AssignExperienceInput
> =>
    useSWRMutation<AssignExperienceResult, unknown, string, AssignExperienceInput>(
        MUTATE_ASSIGN_EXPERIENCE_SWR_KEY,
        async (_key: string, { arg }: AssignExperienceExtra) =>
            (
                await answeredData(
                    failing(() => mutateAssignExperience({ request: arg })),
                    "assignExperience",
                )
            ).assignExperience,
    )
