"use client"

import useSWR, { type SWRResponse } from "swr"
import { failing, type RelayPairingQuery } from "@/modules/api"
import { queryRelayPairing } from "@/modules/api/graphql/queries/query-relay-pairing"

/** Cache identity of the pairing preview; the typed code completes it. */
export const QUERY_RELAY_PAIRING_SWR_KEY = "QUERY_RELAY_PAIRING_SWR"

/** What the learner confirms: the device name, its platform and when the code lapses. */
export type RelayPairing = RelayPairingQuery["relayPairing"]

/** Reads the pending pairing a complete code names; with no code it does not run. */
export const useQueryRelayPairingSwr = (userCode: string | undefined): SWRResponse<RelayPairing> =>
    useSWR<RelayPairing>(
        userCode === undefined ? null : [QUERY_RELAY_PAIRING_SWR_KEY, userCode],
        async () => {
            const { data } = await failing(() => queryRelayPairing({ userCode: userCode ?? "" }))
            if (data === undefined) throw new Error("relayPairing answered no data")
            return data.relayPairing
        },
        { shouldRetryOnError: false, revalidateOnFocus: false },
    )
