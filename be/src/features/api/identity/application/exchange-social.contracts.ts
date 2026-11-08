/** Values the exchange-social door passes on; the domain decides what they mean. */
export interface ExchangeSocialRequest {
    /** The single-use authorization code. */
    readonly code: string
    /** The one-use state returned by the provider. */
    readonly state: string
    /** The state the browser's pre-authentication cookie carries, as the door read it. */
    readonly binding: string | undefined
}
