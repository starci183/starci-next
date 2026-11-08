import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the SePay rail. */
export enum SepayErrorCode {
    /** This instance declares no SePay channel, so no delivery can be trusted. */
    RailNotConfigured = "SEPAY_RAIL_NOT_CONFIGURED",
    /** The delivery's `x-secret-key` header does not prove the configured IPN secret key. */
    SecretInvalid = "SEPAY_SECRET_INVALID",
    /** The delivery body is not a readable SePay IPN notification. */
    PayloadMalformed = "SEPAY_PAYLOAD_MALFORMED",
    /** The checkout request names no payable order or return address. */
    CheckoutInvalid = "SEPAY_CHECKOUT_INVALID",
}

/** How each SePay code travels. */
export const SEPAY_ERROR_KINDS: Record<SepayErrorCode, ErrorKind> = {
    [SepayErrorCode.RailNotConfigured]: "unavailable",
    [SepayErrorCode.SecretInvalid]: "unauthenticated",
    [SepayErrorCode.PayloadMalformed]: "invalid",
    [SepayErrorCode.CheckoutInvalid]: "invalid",
}

/** The one error class of the SePay rail. */
export class SepayError extends DomainError<SepayErrorCode> {}
