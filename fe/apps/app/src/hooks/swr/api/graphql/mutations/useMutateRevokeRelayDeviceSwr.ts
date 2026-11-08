"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type RevokeRelayDeviceMutation } from "@/modules/api"
import { mutateRevokeRelayDevice } from "@/modules/api/graphql/mutations/mutation-revoke-relay-device"

/** Cache identity of the revoke write. */
export const MUTATE_REVOKE_RELAY_DEVICE_SWR_KEY = "MUTATE_REVOKE_RELAY_DEVICE_SWR"

/** The device the revoke ended. */
export type RevokedRelayDevice = RevokeRelayDeviceMutation["revokeRelayDevice"]

/** The extra argument SWR hands the mutation fetcher: the device id. */
interface RevokeRelayDeviceExtra {
    readonly arg: string
}

/** Revokes one device on demand; the trigger rejects with the typed failure (RELAY_DEVICE_NOT_FOUND). */
export const useMutateRevokeRelayDeviceSwr = (): SWRMutationResponse<RevokedRelayDevice, unknown, string, string> =>
    useSWRMutation<RevokedRelayDevice, unknown, string, string>(
        MUTATE_REVOKE_RELAY_DEVICE_SWR_KEY,
        async (_key: string, { arg }: RevokeRelayDeviceExtra) => {
            const { data } = await failing(() => mutateRevokeRelayDevice({ id: arg }))
            if (data === undefined) throw new Error("revokeRelayDevice answered no data")
            return data.revokeRelayDevice
        },
    )
