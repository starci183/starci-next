/** What confirm relay device takes; who asks comes from the session or, for the CLI handshake, from nothing. */
export interface ConfirmRelayDeviceRequest {
    /** The short code the learner typed. */
    readonly userCode: string
}
