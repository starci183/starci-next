/** The headers of one SePay IPN delivery the verification reads; every value is optional because the transport passes them as they arrived. */
export interface SepayConfirmationHeaders {
    /** The `x-secret-key` header SePay authenticates its IPN deliveries with (the merchant's configured IPN secret key). */
    readonly "x-secret-key"?: string
}

/** What one verification is given: the body SePay posted to this deployment's IPN route, parsed but not yet trusted. */
export interface SepayConfirmationInput {
    /** The posted IPN notification (`timestamp`, `notification_type`, `order`, `transaction`, `customer`), parsed from JSON. */
    readonly body: unknown
    /** The headers the delivery carried. */
    readonly headers: SepayConfirmationHeaders
}

/**
 * What a verified notification reports: `paid` (an `ORDER_PAID` whose order is `CAPTURED` and transaction `APPROVED`),
 * `voided` (a `TRANSACTION_VOID`), or `unpaid` (any other verified notification).
 */
export type SepayPaymentState = "paid" | "voided" | "unpaid"

/**
 * One SePay notification the rail itself proved: the configured secret key authenticated the delivery. Its state says
 * whether it reports the order paid; a caller settles only a paid one, and the confirmation itself grants nothing.
 */
export interface SepayConfirmation {
    /** The rail that proved this confirmation. */
    readonly rail: "sepay"
    /** What the notification reports about the payment. */
    readonly state: SepayPaymentState
    /** The provider's own transaction id, recorded as settlement evidence. */
    readonly providerRef: string
    /** The invoice number the order was created under (`order.order_invoice_number`). */
    readonly orderCode: string
    /** The amount SePay reports as paid, in the order's own currency (`order.order_amount`). */
    readonly amount: number
    /** The currency SePay reports the order in (`order.order_currency`); empty when the notification names none. */
    readonly currency: string
}

/** What one checkout is given: the order the purchase domain persisted and where the buyer returns to. */
export interface SepayCheckoutInput {
    /** The unique invoice number the order is created under (`order_invoice_number`). */
    readonly orderCode: string
    /** The amount to charge, a positive whole number of VND. */
    readonly amount: number
    /** The order description the buyer sees; SePay's form requires one (`order_description`). */
    readonly description: string
    /** Where SePay sends the buyer after a successful payment; display only, never confirmation. */
    readonly successUrl: string
    /** Where SePay sends the buyer after a failed payment. */
    readonly errorUrl: string
    /** Where SePay sends the buyer who cancels. */
    readonly cancelUrl: string
}

/** The server-signed one-time-payment form the browser submits to SePay. */
export interface SepayCheckoutRedirect {
    /** The form is submitted with this HTTP method. */
    readonly method: "POST"
    /** The form action URL. */
    readonly url: string
    /** The signed form fields in the order SePay's specification signs them and the form must post them, then `signature`. */
    readonly fields: Readonly<Record<string, string>>
}

/** One SePay checkout the rail started: the order it names and the signed form that takes the buyer to pay. */
export interface SepayCheckout {
    /** The rail that started this checkout. */
    readonly rail: "sepay"
    /** The invoice number the order was created under. */
    readonly orderCode: string
    /** The amount the checkout charges. */
    readonly amount: number
    /** The signed form to submit; SePay gives no reference before payment. */
    readonly redirect: SepayCheckoutRedirect
}
