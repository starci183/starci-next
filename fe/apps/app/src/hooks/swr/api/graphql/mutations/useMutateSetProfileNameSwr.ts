"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type SetProfileNameMutation } from "@/modules/api"
import { mutateSetProfileName } from "@/modules/api/graphql/mutations/mutation-set-profile-name"

/** Cache identity of the display name write. */
export const MUTATE_SET_PROFILE_NAME_SWR_KEY = "MUTATE_SET_PROFILE_NAME_SWR"

/** What one write takes: the name (null or empty clears it) and the locale of the answer. */
export interface SetProfileNameArgument {
    readonly displayName: string | null
    readonly locale: string
}

/** The extra argument SWR hands the fetcher. */
interface SetProfileNameExtra {
    readonly arg: SetProfileNameArgument
}

/** What the write answers. */
export type SetProfileNameResult = SetProfileNameMutation["setProfileName"]

/** Sets the display name of the learner. */
export const useMutateSetProfileNameSwr = (): SWRMutationResponse<
    SetProfileNameResult,
    unknown,
    string,
    SetProfileNameArgument
> =>
    useSWRMutation<SetProfileNameResult, unknown, string, SetProfileNameArgument>(
        MUTATE_SET_PROFILE_NAME_SWR_KEY,
        async (_key: string, { arg }: SetProfileNameExtra) => {
            const { data } = await failing(() => mutateSetProfileName({ request: arg }))
            if (data === undefined) throw new Error("setProfileName answered no data")
            return data.setProfileName
        },
    )
