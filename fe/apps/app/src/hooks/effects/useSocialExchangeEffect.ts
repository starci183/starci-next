"use client"

import { useEffect } from "react"
import { usePostIdentitySocialExchangeSwr } from "@/hooks/swr"
import { forgetSocialState, isOwnSocialState } from "@/modules/social-state"
import { returnToOf } from "@/modules/routes"

/** What the callback page hands the effect: the provider code and state, and where to go on success and on failure. */
type SocialExchangeInput = {
    readonly code: string | undefined
    readonly state: string | undefined
    /** The home path of the reader locale, used when the exchange answers no valid path. */
    readonly homeHref: string
    /** The sign-in path that reports the failed social sign-in. */
    readonly failureHref: string
}

/**
 * Finishes the social sign-in once the exchange door answered: removes the provider code and state from the address bar, then
 * leaves for the path the door answered (validated again here) or, on any failure or missing value, for the sign-in screen
 * with the failure notice. Only the state of the sign-in this tab started is sent: a callback link carrying a foreign state
 * (login CSRF) is never auto-submitted and lands on the failure notice.
 */
export const useSocialExchangeEffect = (input: SocialExchangeInput): void => {
    const own = input.state !== undefined && isOwnSocialState(input.state)
    const { outcome } = usePostIdentitySocialExchangeSwr({ code: input.code, state: own ? input.state : undefined })
    const { code, homeHref, failureHref } = input
    useEffect(() => {
        const missing = code === undefined || !own
        if (!missing && outcome === undefined) return
        forgetSocialState()
        window.history.replaceState(null, "", window.location.pathname)
        const destination = outcome?.success === true ? (returnToOf(outcome.data) ?? homeHref) : failureHref
        window.location.replace(destination)
    }, [code, own, outcome, homeHref, failureHref])
}
