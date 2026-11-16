"use client"

import useSWRMutation from "swr/mutation"
import { putAvatar, type AvatarPutTarget } from "@/modules/api"

/** Cache identity of the call; a mutation never reads it back. */
const MUTATE_PUT_AVATAR_SWR_KEY = "MUTATE_PUT_AVATAR_SWR"

/** What one upload takes: the signed target the back end answered and the picked file. */
export type PutAvatarArgument = { readonly target: AvatarPutTarget; readonly file: File }

/** The extra argument SWR hands the fetcher. */
type PutAvatarExtra = { readonly arg: PutAvatarArgument }

/** What usePutAvatarSwr answers: the call, which resolves with whether the store accepted the bytes, and whether it runs. */
type PutAvatarHook = {
    readonly trigger: (argument: PutAvatarArgument) => Promise<boolean>
    readonly pending: boolean
}

/** Sends the avatar bytes to the signed address of the object store. */
export const usePutAvatarSwr = (): PutAvatarHook => {
    const { trigger, isMutating } = useSWRMutation(MUTATE_PUT_AVATAR_SWR_KEY, (_key: string, extra: PutAvatarExtra) =>
        putAvatar(extra.arg.target, extra.arg.file),
    )
    return { trigger: (argument) => trigger(argument), pending: isMutating }
}
