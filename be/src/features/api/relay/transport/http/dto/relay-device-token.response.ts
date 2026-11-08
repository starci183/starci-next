/** The body the device-token door answers once: the device's own bearer token. */
export interface RelayDeviceTokenResponse {
    /** The device token; the relay stores only its digest. */
    readonly deviceToken: string
}
