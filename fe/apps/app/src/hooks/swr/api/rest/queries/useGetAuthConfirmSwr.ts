"use client"

import useSWR from "swr"
import { sendEmailDoor, type AuthFailure } from "@/modules/auth"

/** Cache identity of the confirmation; the token is part of the key, so one link is spent once per page. */
export const GET_AUTH_CONFIRM_SWR_KEY = "GET_AUTH_CONFIRM_SWR"

/** What useGetAuthConfirmSwr answers: the failure the door answered (undefined when it accepted), and whether the call still runs. */
export type GetAuthConfirmHook = {
    readonly failure: AuthFailure | undefined
    readonly loading: boolean
}

/** Spends the emailed confirmation token once through the confirm door, wrapped in SWR (no retry, no revalidation: a token works once). */
export const useGetAuthConfirmSwr = (token: string | undefined): GetAuthConfirmHook => {
    const { data, isLoading } = useSWR<{ readonly failure: AuthFailure | undefined }>(
        token === undefined || token === "" ? null : [GET_AUTH_CONFIRM_SWR_KEY, token],
        async () => ({ failure: await sendEmailDoor("confirm", { token }) }),
        { revalidateOnFocus: false, revalidateOnReconnect: false, shouldRetryOnError: false, revalidateIfStale: false },
    )
    return { failure: data?.failure, loading: isLoading }
}
