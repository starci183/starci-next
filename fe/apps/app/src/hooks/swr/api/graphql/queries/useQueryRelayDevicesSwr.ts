"use client"

import useSWR, { type SWRResponse } from "swr"
import { failing, type RelayDevicesQuery } from "@/modules/api"
import { queryRelayDevices } from "@/modules/api/graphql/queries/query-relay-devices"

/** Cache identity of the device list; the SWR cache is already scoped to the viewer on screen. */
export const QUERY_RELAY_DEVICES_SWR_KEY = "QUERY_RELAY_DEVICES_SWR"

/** The learner's paired devices as the list reads them. */
export type RelayDevices = RelayDevicesQuery["relayDevices"]

/** Reads the learner's paired devices; `isEnabled` is false while there is no session, since the door needs one. */
export const useQueryRelayDevicesSwr = (isEnabled: boolean): SWRResponse<RelayDevices> =>
    useSWR<RelayDevices>(isEnabled ? QUERY_RELAY_DEVICES_SWR_KEY : null, async () => {
        const { data } = await failing(() => queryRelayDevices())
        if (data === undefined) throw new Error("relayDevices answered no data")
        return data.relayDevices
    })
