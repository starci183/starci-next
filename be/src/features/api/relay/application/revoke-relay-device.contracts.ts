/** What revoke relay device takes; who asks comes from the session or, for the CLI handshake, from nothing. */
export interface RevokeRelayDeviceRequest {
    /** The device to revoke. */
    readonly deviceId: string
}
