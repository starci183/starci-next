"use client"

import { useCallback, useState } from "react"
import { useMutateStartPremiumCheckoutSwr } from "@/hooks/swr"
import { leaveForCheckout } from "@/modules/checkout"
import { checkoutFailureOf, type CheckoutFailure } from "./checkout.shared"

/** What the checkout commands hand the screen. */
interface CheckoutCommands {
    /** True while a start is pending: the trigger is disabled so one press makes one order. */
    readonly isStarting: boolean
    /** Why the last start failed, or undefined. */
    readonly failure: CheckoutFailure | undefined
    /** Starts a checkout for the plan (and the rail, when chosen) and sends the browser to the gateway on success. */
    readonly start: (plan: string, rail: string | undefined) => void
}

/** The write of the plans screen: start a checkout, then leave for the gateway the server chose. */
export const useCheckoutCommands = (): CheckoutCommands => {
    const mutation = useMutateStartPremiumCheckoutSwr()
    const [failure, setFailure] = useState<CheckoutFailure>()
    const { trigger } = mutation
    const start = useCallback(
        (plan: string, rail: string | undefined): void => {
            setFailure(undefined)
            trigger({ plan, rail }).then(
                (checkout) => {
                    if (!leaveForCheckout(checkout.redirect)) setFailure("other")
                },
                (error: unknown) => setFailure(checkoutFailureOf(error)),
            )
        },
        [trigger],
    )
    return { isStarting: mutation.isMutating, failure, start }
}
