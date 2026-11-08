"use client"

import { useState } from "react"
import useSWR, { type SWRResponse } from "swr"
import { failing, type PremiumOrderQuery } from "@/modules/api"
import { queryPremiumOrder } from "@/modules/api/graphql/queries/query-premium-order"

/** Cache identity of the order read; the order id is part of the key. */
export const QUERY_PREMIUM_ORDER_SWR_KEY = "QUERY_PREMIUM_ORDER_SWR"

/** The order and the server's status of it. */
export type PremiumOrder = PremiumOrderQuery["premiumOrder"]

/** The wait before the next poll, by how many reads were made: 3 s growing to 30 s. */
const POLL_DELAYS_MS = [3_000, 5_000, 8_000, 13_000, 21_000, 30_000] as const

/** The most reads a verifying order is polled for (about twenty minutes); after it the page keeps its last answer. */
const POLL_CAP = 50

/**
 * Reads one order and polls it while the server says it is still `verifying`, with a growing wait and a cap. Any other
 * answer stops the polling, and `orderId` or `isEnabled` missing leaves the read idle. A refusal (an order that is not the
 * reader's) is a settled answer, so it is not retried.
 */
export const useQueryPremiumOrderSwr = (orderId: string | undefined, isEnabled: boolean): SWRResponse<PremiumOrder> => {
    const [reads, setReads] = useState(0)
    return useSWR<PremiumOrder>(
        isEnabled && orderId !== undefined ? [QUERY_PREMIUM_ORDER_SWR_KEY, orderId] : null,
        async ([, id]: readonly [string, string]) => {
            const { data } = await failing(() => queryPremiumOrder({ orderId: id }))
            if (data === undefined) throw new Error("premiumOrder answered no data")
            return data.premiumOrder
        },
        {
            shouldRetryOnError: false,
            onSuccess: () => {
                setReads((count) => count + 1)
            },
            refreshInterval: (latest: PremiumOrder | undefined): number => {
                if (latest?.status !== "verifying" || reads >= POLL_CAP) return 0
                return POLL_DELAYS_MS[Math.min(reads, POLL_DELAYS_MS.length - 1)] ?? 0
            },
        },
    )
}
