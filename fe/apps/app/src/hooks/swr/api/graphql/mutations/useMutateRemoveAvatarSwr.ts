"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type RemoveAvatarMutation } from "@/modules/api"
import { mutateRemoveAvatar } from "@/modules/api/graphql/mutations/mutation-remove-avatar"

/** Cache identity of the avatar removal. */
export const MUTATE_REMOVE_AVATAR_SWR_KEY = "MUTATE_REMOVE_AVATAR_SWR"

/** What the removal takes: the locale of the answer. */
export interface RemoveAvatarArgument {
    readonly locale: string
}

/** The extra argument SWR hands the fetcher. */
interface RemoveAvatarExtra {
    readonly arg: RemoveAvatarArgument
}

/** What the removal answers: the profile with no avatar. */
export type RemoveAvatarResult = RemoveAvatarMutation["removeAvatar"]

/** Removes the avatar of the learner. */
export const useMutateRemoveAvatarSwr = (): SWRMutationResponse<
    RemoveAvatarResult,
    unknown,
    string,
    RemoveAvatarArgument
> =>
    useSWRMutation<RemoveAvatarResult, unknown, string, RemoveAvatarArgument>(
        MUTATE_REMOVE_AVATAR_SWR_KEY,
        async (_key: string, { arg }: RemoveAvatarExtra) => {
            const { data } = await failing(() => mutateRemoveAvatar({ request: arg }))
            if (data === undefined) throw new Error("removeAvatar answered no data")
            return data.removeAvatar
        },
    )
