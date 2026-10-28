/** What one verification is given: the body payOS posted to this deployment's webhook route, parsed but not yet trusted. */
export interface PayosConfirmationInput {
    /** The posted webhook envelope (`code`, `desc`, `success`, `data`, `signature`), parsed from JSON. */
    readonly body: unknown
}

/**
 * One payOS payment confirmation the rail itself proved: the checksum-key signature covers the `data` object and the
 * envelope reports a paid transfer. A caller settles the order it names; the confirmation itself grants nothing.
 */
export interface PayosConfirmation {
    /** The rail that proved this confirmation. */
    readonly rail: "payos"
    /** The provider's own transfer reference, recorded as settlement evidence. */
    readonly providerRef: string
    /** The order code the payment request was created under. */
    readonly orderCode: number
    /** The amount payOS reports as transferred, in the channel's own currency. */
    readonly amount: number
}

/** What one checkout is given: the order the purchase domain persisted, where the buyer returns to, and the request's correlation id. */
export interface PayosCheckoutInput {
    /** The unique order code the payment link is created under, a positive whole number. */
    readonly orderCode: number
    /** The amount to charge, a positive whole number of VND. */
    readonly amount: number
    /** The payment description the buyer sees. */
    readonly description: string
    /** Where payOS sends the buyer after a successful payment; display only, never confirmation. */
    readonly returnUrl: string
    /** Where payOS sends the buyer who cancels. */
    readonly cancelUrl: string
    /** The correlation id of the request that started this checkout, forwarded to payOS. */
    readonly correlationId: string
}

/** Where the buyer is sent to pay a payOS payment link. */
export interface PayosCheckoutRedirect {
    /** The buyer follows the link with this HTTP method. */
    readonly method: "GET"
    /** The hosted checkout page (`checkoutUrl`). */
    readonly url: string
}

/** One payOS payment link the rail created and signature-verified. */
export interface PayosCheckout {
    /** The rail that created this checkout. */
    readonly rail: "payos"
    /** The provider's payment link id (`paymentLinkId`). */
    readonly providerRef: string
    /** The order code the payment link was created under. */
    readonly orderCode: number
    /** The amount the payment link charges. */
    readonly amount: number
    /** Where the buyer is redirected to pay (`checkoutUrl`). */
    readonly redirect: PayosCheckoutRedirect
}
