"use client"

import useSWR from "swr"
import { exchangeSocialCode, type GraphQLResponse } from "@/modules/api"

/** Cache identity of the exchange; the provider code and state complete it, so one return exchanges once. */
const MUTATE_IDENTITY_SOCIAL_EXCHANGE_SWR_KEY = "MUTATE_IDENTITY_SOCIAL_EXCHANGE_SWR"

/** The provider return to exchange: both values, or undefined while either is missing. */
type SocialExchangeReturn = { readonly code: string | undefined; readonly state: string | undefined }

/** What usePostIdentitySocialExchangeSwr answers: the outcome of the exchange once it settled, undefined while it runs. */
type PostIdentitySocialExchangeHook = { readonly outcome: GraphQLResponse<string> | undefined }

/**
 * Sends the provider code and state to the exchange door once. The door consumes a one-use bundle, so the read never
 * revalidates, never retries and keeps its answer; with a missing code or state it does not run.
 */
export const usePostIdentitySocialExchangeSwr = (input: SocialExchangeReturn): PostIdentitySocialExchangeHook => {
    const { code, state } = input
    const { data } = useSWR(
        code === undefined || state === undefined ? null : [MUTATE_IDENTITY_SOCIAL_EXCHANGE_SWR_KEY, code, state],
        ([, exchangeCode, exchangeState]: readonly [string, string, string]) =>
            exchangeSocialCode(exchangeCode, exchangeState),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            shouldRetryOnError: false,
            dedupingInterval: 600_000,
        },
    )
    return { outcome: data }
}
