"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type ConfirmRelayDeviceMutation } from "@/modules/api"
import { mutateConfirmRelayDevice } from "@/modules/api/graphql/mutations/mutation-confirm-relay-device"

/** Cache identity of the confirm write. */
export const MUTATE_CONFIRM_RELAY_DEVICE_SWR_KEY = "MUTATE_CONFIRM_RELAY_DEVICE_SWR"

/** The device the confirm paired. */
export type ConfirmedRelayDevice = ConfirmRelayDeviceMutation["confirmRelayDevice"]

/** The extra argument SWR hands the mutation fetcher: the code the learner typed. */
interface ConfirmRelayDeviceExtra {
    readonly arg: string
}

/** Confirms a pending pairing on demand; the trigger rejects with the typed failure (RELAY_CODE_NOT_FOUND, RELAY_DEVICE_LIMIT). */
export const useMutateConfirmRelayDeviceSwr = (): SWRMutationResponse<ConfirmedRelayDevice, unknown, string, string> =>
    useSWRMutation<ConfirmedRelayDevice, unknown, string, string>(
        MUTATE_CONFIRM_RELAY_DEVICE_SWR_KEY,
        async (_key: string, { arg }: ConfirmRelayDeviceExtra) => {
            const { data } = await failing(() => mutateConfirmRelayDevice({ userCode: arg }))
            if (data === undefined) throw new Error("confirmRelayDevice answered no data")
            return data.confirmRelayDevice
        },
    )
