"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type RequestAvatarUploadMutation } from "@/modules/api"
import { mutateRequestAvatarUpload } from "@/modules/api/graphql/mutations/mutation-request-avatar-upload"

/** Cache identity of the avatar upload request. */
export const MUTATE_REQUEST_AVATAR_UPLOAD_SWR_KEY = "MUTATE_REQUEST_AVATAR_UPLOAD_SWR"

/** What one request takes: the content type and the exact size of the image. */
export interface RequestAvatarUploadArgument {
    readonly contentType: string
    readonly size: number
}

/** The extra argument SWR hands the fetcher. */
interface RequestAvatarUploadExtra {
    readonly arg: RequestAvatarUploadArgument
}

/** The signed upload the request answers. */
export type AvatarUpload = RequestAvatarUploadMutation["requestAvatarUpload"]

/** Asks for a signed upload of an avatar. */
export const useMutateRequestAvatarUploadSwr = (): SWRMutationResponse<
    AvatarUpload,
    unknown,
    string,
    RequestAvatarUploadArgument
> =>
    useSWRMutation<AvatarUpload, unknown, string, RequestAvatarUploadArgument>(
        MUTATE_REQUEST_AVATAR_UPLOAD_SWR_KEY,
        async (_key: string, { arg }: RequestAvatarUploadExtra) => {
            const { data } = await failing(() => mutateRequestAvatarUpload({ request: arg }))
            if (data === undefined) throw new Error("requestAvatarUpload answered no data")
            return data.requestAvatarUpload
        },
    )
