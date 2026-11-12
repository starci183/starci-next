import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the relay capability. */
export enum RelayErrorCode {
    /** The pairing code is unknown, expired or already used. */
    CodeNotFound = "RELAY_CODE_NOT_FOUND",
    /** The learner already has as many paired devices as their plan allows. */
    DeviceLimit = "RELAY_DEVICE_LIMIT",
    /** The learner has not confirmed the pairing code yet. */
    Pending = "RELAY_PENDING",
    /** The device token is unknown or its device was revoked. */
    DeviceRevoked = "RELAY_DEVICE_REVOKED",
    /** The device does not exist or belongs to another learner; the two are indistinguishable. */
    DeviceNotFound = "RELAY_DEVICE_NOT_FOUND",
    /** The device name or platform of a pairing request is outside its bounds. */
    PairingInvalid = "RELAY_PAIRING_INVALID",
    /** An upload or a manifest request is not well formed for its kind or is over its size. */
    PayloadInvalid = "RELAY_PAYLOAD_INVALID",
    /** The relay could not read or write its device state. */
    Unavailable = "RELAY_UNAVAILABLE",
}

/** How each relay code travels. */
export const RELAY_ERROR_KINDS: Record<RelayErrorCode, ErrorKind> = {
    [RelayErrorCode.CodeNotFound]: "not-found",
    [RelayErrorCode.DeviceLimit]: "forbidden",
    [RelayErrorCode.Pending]: "conflict",
    [RelayErrorCode.DeviceRevoked]: "unauthenticated",
    [RelayErrorCode.DeviceNotFound]: "not-found",
    [RelayErrorCode.PairingInvalid]: "invalid",
    [RelayErrorCode.PayloadInvalid]: "invalid",
    [RelayErrorCode.Unavailable]: "unavailable",
}

/** The one error class of the relay capability. */
export class RelayError extends DomainError<RelayErrorCode> {}
