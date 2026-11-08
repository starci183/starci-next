/** What start relay pairing takes; who asks comes from the session or, for the CLI handshake, from nothing. */
export interface StartRelayPairingRequest {
    /** The device name the learner will recognise. */
    readonly deviceName: string
    /** The device's operating system. */
    readonly platform: string
}
