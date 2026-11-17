"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type StartPremiumCheckoutMutation } from "@/modules/api"
import { mutateStartPremiumCheckout } from "@/modules/api/graphql/mutations/mutation-start-premium-checkout"

/** Cache identity of the start-checkout write. */
export const MUTATE_START_PREMIUM_CHECKOUT_SWR_KEY = "MUTATE_START_PREMIUM_CHECKOUT_SWR"

/** What starting a checkout answers: the new order and where the browser goes to pay it. */
export type PremiumCheckout = StartPremiumCheckoutMutation["startPremiumCheckout"]

/** What one start-checkout call takes: the chosen plan and, when the reader chose one, the rail. */
export interface StartPremiumCheckoutArgument {
    readonly plan: string
    readonly rail: string | undefined
}

/** The extra argument SWR hands the mutation fetcher. */
interface StartPremiumCheckoutExtra {
    readonly arg: StartPremiumCheckoutArgument
}

/** Starts a Premium checkout on demand; the trigger rejects with the typed failure, and `isMutating` is true while a call is pending. */
export const useMutateStartPremiumCheckoutSwr = (): SWRMutationResponse<
    PremiumCheckout,
    unknown,
    string,
    StartPremiumCheckoutArgument
> =>
    useSWRMutation<PremiumCheckout, unknown, string, StartPremiumCheckoutArgument>(
        MUTATE_START_PREMIUM_CHECKOUT_SWR_KEY,
        async (_key: string, { arg }: StartPremiumCheckoutExtra) => {
            const { data } = await failing(() => mutateStartPremiumCheckout({ plan: arg.plan, rail: arg.rail }))
            if (data === undefined) throw new Error("startPremiumCheckout answered no data")
            return data.startPremiumCheckout
        },
    )
