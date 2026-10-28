/** Structured, content-free telemetry event identities of the SePay rail. */
export enum SepayLogEvent {
    /** A posted confirmation failed verification and was refused. */
    ConfirmationRefused = "sepay.confirmation_refused",
    /** A checkout request named an order the rail cannot sign and was refused. */
    CheckoutRefused = "sepay.checkout_refused",
}
