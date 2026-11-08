/** The body the device-start door answers: the secret code the CLI keeps and the short code the learner types. */
export interface RelayDeviceStartResponse {
    /** The secret the CLI exchanges for its token. */
    readonly deviceCode: string
    /** The short code the learner types on the web. */
    readonly userCode: string
    /** The page the learner confirms the code on. */
    readonly verifyUrl: string
    /** The UTC instant the pairing lapses. */
    readonly expiresAt: string
}
