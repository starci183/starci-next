import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the purchase capability. */
export enum PurchaseErrorCode {
    /** The named plan is no server-owned offer. */
    PlanUnknown = "PURCHASE_PLAN_UNKNOWN",
    /** The rail refused the checkout of a persisted purchase. */
    CheckoutRefused = "PURCHASE_CHECKOUT_REFUSED",
    /** The provider did not authenticate or prove the delivery. */
    ConfirmationRefused = "PURCHASE_CONFIRMATION_REFUSED",
    /** The delivery was not the provider's expected body shape. */
    DeliveryMalformed = "PURCHASE_DELIVERY_MALFORMED",
    /** The purchase is in a state no confirmation may settle. */
    PurchaseNotPayable = "PURCHASE_NOT_PAYABLE",
    /** A purchase or entitlement row did not come back from its write. */
    PurchaseMissing = "PURCHASE_MISSING",
    /** The named payment rail is none this capability serves. */
    RailUnknown = "PURCHASE_RAIL_UNKNOWN",
    /** The order does not exist or belongs to another learner; the two are indistinguishable. */
    OrderNotFound = "PURCHASE_ORDER_NOT_FOUND",
}

/** How each purchase code travels. */
export const PURCHASE_ERROR_KINDS: Record<PurchaseErrorCode, ErrorKind> = {
    [PurchaseErrorCode.PlanUnknown]: "invalid",
    [PurchaseErrorCode.CheckoutRefused]: "unavailable",
    [PurchaseErrorCode.ConfirmationRefused]: "unauthenticated",
    [PurchaseErrorCode.DeliveryMalformed]: "invalid",
    [PurchaseErrorCode.PurchaseNotPayable]: "conflict",
    [PurchaseErrorCode.PurchaseMissing]: "internal",
    [PurchaseErrorCode.RailUnknown]: "invalid",
    [PurchaseErrorCode.OrderNotFound]: "not-found",
}

/** The one error class of the purchase capability. */
export class PurchaseError extends DomainError<PurchaseErrorCode> {}
