"use client"

import useSWR, { type SWRResponse } from "swr"
import { failing, type PremiumPlansQuery } from "@/modules/api"
import { queryPremiumPlans } from "@/modules/api/graphql/queries/query-premium-plans"

/** Cache identity of the Premium plans read; the catalog is public and carries no viewer or request identity. */
export const QUERY_PREMIUM_PLANS_SWR_KEY = "QUERY_PREMIUM_PLANS_SWR"

/** The offers the server prices: every plan with its term and fixed VND amount; the client never computes a price. */
export type PremiumOffers = PremiumPlansQuery["premiumPlans"]

/** Reads the server-owned Premium plans; a failure stays the read's error, never an empty list. */
export const useQueryPremiumPlansSwr = (): SWRResponse<PremiumOffers> =>
    useSWR<PremiumOffers>(QUERY_PREMIUM_PLANS_SWR_KEY, async () => {
        const { data } = await failing(() => queryPremiumPlans())
        if (data === undefined) throw new Error("premiumPlans answered no data")
        return data.premiumPlans
    })
