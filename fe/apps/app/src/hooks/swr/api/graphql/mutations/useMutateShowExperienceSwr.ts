"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { answeredData, failing, type ShowExperienceInput, type ShowExperienceMutation } from "@/modules/api"
import { mutateShowExperience } from "@/modules/api/graphql/mutations/mutation-show-experience"

/** What the write answers. */
export type ShowExperienceResult = ShowExperienceMutation["showExperience"]

/** Cache identity of the showExperience write. */
export const MUTATE_SHOW_EXPERIENCE_SWR_KEY = "MUTATE_SHOW_EXPERIENCE_SWR"

/** The extra argument SWR hands the fetcher. */
interface ShowExperienceExtra {
    readonly arg: ShowExperienceInput
}

/** Shows or hides a verified item on the public profile. */
export const useMutateShowExperienceSwr = (): SWRMutationResponse<
    ShowExperienceResult,
    unknown,
    string,
    ShowExperienceInput
> =>
    useSWRMutation<ShowExperienceResult, unknown, string, ShowExperienceInput>(
        MUTATE_SHOW_EXPERIENCE_SWR_KEY,
        async (_key: string, { arg }: ShowExperienceExtra) =>
            (
                await answeredData(
                    failing(() => mutateShowExperience({ request: arg })),
                    "showExperience",
                )
            ).showExperience,
    )
