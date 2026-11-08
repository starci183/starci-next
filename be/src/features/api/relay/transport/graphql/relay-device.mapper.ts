import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { PairingPreview, RelayDevice } from "@modules/domain/relay"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ConfirmRelayDeviceRequest } from "../../application/confirm-relay-device.contracts"
import type { GetRelayPairingRequest } from "../../application/get-relay-pairing.contracts"
import type { ListRelayDevicesRequest } from "../../application/list-relay-devices.contracts"
import type { RevokeRelayDeviceRequest } from "../../application/revoke-relay-device.contracts"
import type { RelayUserCodeInput } from "./dto/relay-user-code.input"
import type { RevokeRelayDeviceInput } from "./dto/revoke-relay-device.input"
import type { RelayDeviceType } from "./dto/relay-device.type"
import type { RelayPairingType } from "./dto/relay-pairing.type"
import type { RevokeRelayDeviceType } from "./dto/revoke-relay-device.type"

/** Maps a typed pairing code and the session to the preview query params. */
export const toGetRelayPairingParams = (
    identity: IdentityPrincipal,
    input: RelayUserCodeInput,
): ExecuteParams<GetRelayPairingRequest> => ({
    request: { userCode: input.userCode },
    principal: toPrincipal(identity),
})

/** Maps a typed pairing code and the session to the confirm command params. */
export const toConfirmRelayDeviceParams = (
    identity: IdentityPrincipal,
    input: RelayUserCodeInput,
): ExecuteParams<ConfirmRelayDeviceRequest> => ({
    request: { userCode: input.userCode },
    principal: toPrincipal(identity),
})

/** Maps the session to the device list query params. */
export const toListRelayDevicesParams = (identity: IdentityPrincipal): ExecuteParams<ListRelayDevicesRequest> => ({
    request: {},
    principal: toPrincipal(identity),
})

/** Maps a device id and the session to the revoke command params. */
export const toRevokeRelayDeviceParams = (
    identity: IdentityPrincipal,
    input: RevokeRelayDeviceInput,
): ExecuteParams<RevokeRelayDeviceRequest> => ({ request: { deviceId: input.id }, principal: toPrincipal(identity) })

/** Maps a pending pairing to its GraphQL type. */
export const toRelayPairingType = (preview: PairingPreview): RelayPairingType => ({
    name: preview.name,
    platform: preview.platform,
    expiresAt: preview.expiresAt,
})

/** Maps a device to its GraphQL type. */
export const toRelayDeviceType = (device: RelayDevice): RelayDeviceType => ({
    id: device.id,
    name: device.name,
    platform: device.platform,
    pairedAt: device.pairedAt,
    lastSeenAt: device.lastSeenAt,
    online: device.online,
})

/** Maps the device list to its GraphQL types. */
export const toRelayDeviceTypes = (devices: ReadonlyArray<RelayDevice>): Array<RelayDeviceType> =>
    devices.map((device) => ({
        id: device.id,
        name: device.name,
        platform: device.platform,
        pairedAt: device.pairedAt,
        lastSeenAt: device.lastSeenAt,
        online: device.online,
    }))

/** Maps a revoked device id to its GraphQL type. */
export const toRevokeRelayDeviceType = (id: string): RevokeRelayDeviceType => ({ id })
