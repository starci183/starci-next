"use client"

import { useSocialExchangeEffect } from "@/hooks/effects"
import { SocialCallbackStatusBase } from "./component"

/** What the callback page hands the block: the status words, the provider code and state, and the two paths it may leave for. */
export type SocialCallbackStatusProps = {
    readonly status: string
    readonly code: string | undefined
    readonly state: string | undefined
    readonly homeHref: string
    readonly failureHref: string
}

/** Finishes the social sign-in once on arrival (code and state go to the exchange door and leave the address bar), then leaves the page. */
export const SocialCallbackStatus = (props: SocialCallbackStatusProps) => {
    useSocialExchangeEffect({
        code: props.code,
        state: props.state,
        homeHref: props.homeHref,
        failureHref: props.failureHref,
    })
    return <SocialCallbackStatusBase props={{ status: props.status }} />
}
