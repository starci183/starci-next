/** What get relay pairing takes; who asks comes from the session or, for the CLI handshake, from nothing. */
export interface GetRelayPairingRequest {
    /** The short code the learner typed. */
    readonly userCode: string
}
