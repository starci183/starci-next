"use client"

import { useState } from "react"
import {
    useMutateConfirmRelayDeviceSwr,
    useMutateRevokeRelayDeviceSwr,
    useQueryRelayDevicesSwr,
    useQueryRelayPairingSwr,
    type RelayDevices,
    type RelayPairing,
} from "@/hooks/swr"
import { completeCodeOf, pairingIssueOf, type PairingIssue } from "./devices.shared"

/** What the pairing screen holds and does. */
export type DevicePairing = {
    readonly code: string
    readonly setCode: (value: string) => void
    /** The pending pairing the complete code names, once read. */
    readonly preview: RelayPairing | undefined
    /** True while the complete code names no pending pairing. */
    readonly isCodeUnknown: boolean
    readonly confirm: () => void
    readonly isConfirming: boolean
    /** The name of the device just paired, or undefined. */
    readonly confirmedName: string | undefined
    readonly issue: PairingIssue
    readonly devices: RelayDevices | undefined
    readonly devicesError: unknown
    readonly isDevicesLoading: boolean
    readonly retryDevices: () => void
    readonly revoke: (id: string) => void
    readonly revokingId: string | undefined
}

/** The pairing code entry, its preview, the confirm and the device list with revoke, for the signed-in learner. */
export const useDevicePairing = (isSignedIn: boolean): DevicePairing => {
    const [code, setCode] = useState("")
    const [issue, setIssue] = useState<PairingIssue>("none")
    const [confirmedName, setConfirmedName] = useState<string | undefined>(undefined)
    const [revokingId, setRevokingId] = useState<string | undefined>(undefined)
    const complete = isSignedIn ? completeCodeOf(code) : undefined
    const preview = useQueryRelayPairingSwr(complete)
    const devices = useQueryRelayDevicesSwr(isSignedIn)
    const confirmer = useMutateConfirmRelayDeviceSwr()
    const revoker = useMutateRevokeRelayDeviceSwr()
    const confirm = (): void => {
        if (complete === undefined) return
        setIssue("none")
        confirmer
            .trigger(complete)
            .then((device) => {
                setConfirmedName(device.name)
                setCode("")
                return devices.mutate()
            })
            .catch((error: unknown) => setIssue(pairingIssueOf(error)))
    }
    const revoke = (id: string): void => {
        setRevokingId(id)
        revoker
            .trigger(id)
            .then(() => devices.mutate())
            .catch((error: unknown) => setIssue(pairingIssueOf(error)))
            .finally(() => setRevokingId(undefined))
    }
    return {
        code,
        setCode: (value) => {
            setCode(value)
            setIssue("none")
            setConfirmedName(undefined)
        },
        preview: preview.data,
        isCodeUnknown: complete !== undefined && preview.error !== undefined,
        confirm,
        isConfirming: confirmer.isMutating,
        confirmedName,
        issue,
        devices: devices.data,
        devicesError: devices.error,
        isDevicesLoading: devices.isLoading,
        retryDevices: () => void devices.mutate(),
        revoke,
        revokingId,
    }
}
