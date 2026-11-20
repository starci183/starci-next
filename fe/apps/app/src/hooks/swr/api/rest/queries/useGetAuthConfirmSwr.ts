"use client"

import useSWR from "swr"
import { isLinkInvalid } from "@starci/auth/client"
import { sendEmailDoor, type AuthFailure } from "@/modules/auth"

/** Cache identity of the confirmation; the token is part of the key, so one link is spent once per page. */
export const GET_AUTH_CONFIRM_SWR_KEY = "GET_AUTH_CONFIRM_SWR"

/** What useGetAuthConfirmSwr answers: the failure the door answered (undefined when it accepted), and whether the call still runs. */
export type GetAuthConfirmHook = {
    readonly failure: AuthFailure | undefined
    readonly loading: boolean
}

/**
 * The spend of each token this page load already started. A remount (React's dev double mount, a loading boundary that hands over)
 * runs the fetcher again outside SWR's dedupe; the second call would find the token spent and turn a confirmed link into "invalid".
 */
const spent = new Map<string, Promise<{ readonly failure: AuthFailure | undefined }>>()

/**
 * The one spend of a token: the first call sends it, every later call answers the same promise. An unreachable back end forgets
 * the spend, so opening the link again (without a reload) tries once more; a spent or invalid link stays remembered.
 */
const spendOnce = (token: string): Promise<{ readonly failure: AuthFailure | undefined }> => {
    const known = spent.get(token)
    if (known !== undefined) return known
    const running = sendEmailDoor("confirm", { token }).then((failure) => {
        if (failure !== undefined && !isLinkInvalid(failure.code)) spent.delete(token)
        return { failure }
    })
    spent.set(token, running)
    return running
}

/** Spends the emailed confirmation token once through the confirm door, wrapped in SWR (no retry, no revalidation: a token works once). */
export const useGetAuthConfirmSwr = (token: string | undefined): GetAuthConfirmHook => {
    const { data, isLoading } = useSWR<{ readonly failure: AuthFailure | undefined }>(
        token === undefined || token === "" ? null : [GET_AUTH_CONFIRM_SWR_KEY, token],
        () => spendOnce(token ?? ""),
        { revalidateOnFocus: false, revalidateOnReconnect: false, shouldRetryOnError: false, revalidateIfStale: false },
    )
    return { failure: data?.failure, loading: isLoading }
}
