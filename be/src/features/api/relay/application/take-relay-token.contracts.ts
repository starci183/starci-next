/** What take relay token takes; who asks comes from the session or, for the CLI handshake, from nothing. */
export interface TakeRelayTokenRequest {
    /** The secret device code the start answered. */
    readonly deviceCode: string
}
