/** Structured, content-free telemetry event identities of the payOS rail. */
export enum PayosLogEvent {
    /** A posted confirmation failed verification and was refused. */
    ConfirmationRefused = "payos.confirmation_refused",
    /** A checkout could not be started and was refused. */
    CheckoutRefused = "payos.checkout_refused",
}
