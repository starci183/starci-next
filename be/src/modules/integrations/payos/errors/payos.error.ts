import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the payOS rail. */
export enum PayosErrorCode {
    /** This instance declares no payOS channel, so no delivery can be trusted. */
    RailNotConfigured = "PAYOS_RAIL_NOT_CONFIGURED",
    /** The delivery's signature does not prove the checksum key. */
    SignatureInvalid = "PAYOS_SIGNATURE_INVALID",
    /** The delivery body is not a readable payOS webhook. */
    PayloadMalformed = "PAYOS_PAYLOAD_MALFORMED",
    /** The checkout request names no payable order or return address. */
    CheckoutInvalid = "PAYOS_CHECKOUT_INVALID",
    /** payOS could not be reached within the deadline. */
    Unavailable = "PAYOS_UNAVAILABLE",
    /** payOS answered the payment request with a refusal. */
    CheckoutRefused = "PAYOS_CHECKOUT_REFUSED",
    /** The payment request may exist at payOS but could not be proved payable; its order code is the reconciliation identity. */
    CheckoutOutcomeUnknown = "PAYOS_CHECKOUT_OUTCOME_UNKNOWN",
}

/** How each payOS code travels. */
export const PAYOS_ERROR_KINDS: Record<PayosErrorCode, ErrorKind> = {
    [PayosErrorCode.RailNotConfigured]: "unavailable",
    [PayosErrorCode.SignatureInvalid]: "unauthenticated",
    [PayosErrorCode.PayloadMalformed]: "invalid",
    [PayosErrorCode.CheckoutInvalid]: "invalid",
    [PayosErrorCode.Unavailable]: "unavailable",
    [PayosErrorCode.CheckoutRefused]: "conflict",
    [PayosErrorCode.CheckoutOutcomeUnknown]: "conflict",
}

/** The one error class of the payOS rail. */
export class PayosError extends DomainError<PayosErrorCode> {}
