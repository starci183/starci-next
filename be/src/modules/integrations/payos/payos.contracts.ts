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
