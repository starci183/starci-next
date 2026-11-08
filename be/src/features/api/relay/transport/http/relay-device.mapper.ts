import type { DevicePairing, DeviceToken } from "@modules/domain/relay"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { StartRelayPairingRequest } from "../../application/start-relay-pairing.contracts"
import type { TakeRelayTokenRequest } from "../../application/take-relay-token.contracts"
import type { RelayDeviceStartRequest } from "./dto/relay-device-start.request"
import type { RelayDeviceStartResponse } from "./dto/relay-device-start.response"
import type { RelayDeviceTokenRequest } from "./dto/relay-device-token.request"
import type { RelayDeviceTokenResponse } from "./dto/relay-device-token.response"

/** Maps the validated device-start body to its command params. */
export const toStartRelayPairingParams = (
    body: RelayDeviceStartRequest,
): PublicExecuteParams<StartRelayPairingRequest> => ({
    request: { deviceName: body.deviceName, platform: body.platform },
})

/** Maps the started pairing to the door's body. */
export const toRelayDeviceStartResponse = (pairing: DevicePairing): RelayDeviceStartResponse => ({
    deviceCode: pairing.deviceCode,
    userCode: pairing.userCode,
    verifyUrl: pairing.verifyUrl,
    expiresAt: pairing.expiresAt,
})

/** Maps the validated device-token body to its command params. */
export const toTakeRelayTokenParams = (body: RelayDeviceTokenRequest): PublicExecuteParams<TakeRelayTokenRequest> => ({
    request: { deviceCode: body.deviceCode },
})

/** Maps the issued token to the door's body. */
export const toRelayDeviceTokenResponse = (token: DeviceToken): RelayDeviceTokenResponse => ({
    deviceToken: token.deviceToken,
})
