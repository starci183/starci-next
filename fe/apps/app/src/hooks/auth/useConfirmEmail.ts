"use client"

import { isLinkInvalid } from "@starci/auth/client"
import { useGetAuthConfirmSwr } from "@/hooks/swr"

/** What the confirm card says: the token is being spent, the account is active, the link is no good, or the back end could not be reached. */
export type ConfirmVerdict = "working" | "done" | "invalid" | "unavailable"

/** Spends the emailed link once and answers what it came to; a missing token is an invalid link. */
export const useConfirmEmail = (token: string | undefined): ConfirmVerdict => {
    const { failure, loading } = useGetAuthConfirmSwr(token)
    if (token === undefined || token === "") return "invalid"
    if (loading) return "working"
    if (failure === undefined) return "done"
    return isLinkInvalid(failure.code) ? "invalid" : "unavailable"
}
