"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type ConfirmAvatarUploadMutation } from "@/modules/api"
import { mutateConfirmAvatarUpload } from "@/modules/api/graphql/mutations/mutation-confirm-avatar-upload"

/** Cache identity of the avatar confirmation. */
export const MUTATE_CONFIRM_AVATAR_UPLOAD_SWR_KEY = "MUTATE_CONFIRM_AVATAR_UPLOAD_SWR"

/** What one confirmation takes: the key the request answered, the type and size asked for, and the locale. */
export interface ConfirmAvatarUploadArgument {
    readonly key: string
    readonly contentType: string
    readonly size: number
    readonly locale: string
}

/** The extra argument SWR hands the fetcher. */
interface ConfirmAvatarUploadExtra {
    readonly arg: ConfirmAvatarUploadArgument
}

/** What the confirmation answers: the profile with its new avatar. */
export type ConfirmAvatarUploadResult = ConfirmAvatarUploadMutation["confirmAvatarUpload"]

/** Keeps an avatar the browser uploaded. */
export const useMutateConfirmAvatarUploadSwr = (): SWRMutationResponse<
    ConfirmAvatarUploadResult,
    unknown,
    string,
    ConfirmAvatarUploadArgument
> =>
    useSWRMutation<ConfirmAvatarUploadResult, unknown, string, ConfirmAvatarUploadArgument>(
        MUTATE_CONFIRM_AVATAR_UPLOAD_SWR_KEY,
        async (_key: string, { arg }: ConfirmAvatarUploadExtra) => {
            const { data } = await failing(() => mutateConfirmAvatarUpload({ request: arg }))
            if (data === undefined) throw new Error("confirmAvatarUpload answered no data")
            return data.confirmAvatarUpload
        },
    )
