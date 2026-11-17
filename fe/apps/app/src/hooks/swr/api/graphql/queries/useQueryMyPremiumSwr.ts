"use client"

import useSWR, { type SWRResponse } from "swr"
import { failing, type MyPremiumQuery } from "@/modules/api"
import { queryMyPremium } from "@/modules/api/graphql/queries/query-my-premium"

/** Cache identity of the entitlement read; the SWR cache is already scoped to the viewer on screen. */
export const QUERY_MY_PREMIUM_SWR_KEY = "QUERY_MY_PREMIUM_SWR"

/** What the reader holds: whether Premium is active, until when, and the rail last paid on. */
export type MyPremium = MyPremiumQuery["myPremium"]

/** Reads the data of the premium door; a failure stays the read's error. */
const loadMyPremium = async (): Promise<MyPremium> => {
    const { data } = await failing(() => queryMyPremium())
    if (data === undefined) throw new Error("myPremium answered no data")
    return data.myPremium
}

/** Reads the reader's Premium entitlement; `isEnabled` is false while there is no session, since every door needs one. */
export const useQueryMyPremiumSwr = (isEnabled: boolean): SWRResponse<MyPremium> =>
    useSWR<MyPremium>(isEnabled ? QUERY_MY_PREMIUM_SWR_KEY : null, loadMyPremium)
