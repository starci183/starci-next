"use client"

import useSWRMutation from "swr/mutation"
import { sendEmailDoor, type AuthFailure } from "@/modules/auth"

/** Cache identity of the call; a mutation never reads it back. */
const POST_AUTH_DOOR_SWR_KEY = "POST_AUTH_DOOR_SWR"

/** What one call takes: the door (sign-up, resend, forgot, reset) and the fields it posts. */
export type AuthDoorArgument = {
    readonly door: Parameters<typeof sendEmailDoor>[0]
    readonly body: Readonly<Record<string, string | undefined>>
}

/** The extra argument SWR hands the fetcher. */
type AuthDoorExtra = { readonly arg: AuthDoorArgument }

/** What usePostAuthDoorSwr answers: the call, which resolves with the failure the door answered (undefined when it accepted), and whether it runs. */
type PostAuthDoorHook = {
    readonly trigger: (argument: AuthDoorArgument) => Promise<AuthFailure | undefined>
    readonly pending: boolean
}

/** Calls one of the anonymous email doors of the back end auth (sign-up, resend, forgot, reset), wrapped in SWR so no other file calls the operation. */
export const usePostAuthDoorSwr = (): PostAuthDoorHook => {
    const { trigger, isMutating } = useSWRMutation(POST_AUTH_DOOR_SWR_KEY, (_key: string, extra: AuthDoorExtra) =>
        sendEmailDoor(extra.arg.door, extra.arg.body),
    )
    return { trigger: (argument) => trigger(argument), pending: isMutating }
}
