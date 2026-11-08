/** The operating systems a device may report. */
export type RelayPlatform = "windows" | "macos" | "linux"

/** What a pairing start is given by the learner CLI: a name the learner recognises and the device's platform. */
export interface StartPairingInput {
    /** The device name shown before confirming, 1 to 60 characters. */
    readonly deviceName: string
    /** The device's operating system. */
    readonly platform: string
}

/** A pairing just started: the secret device code the CLI keeps, the short code the learner types, where, and until when. */
export interface DevicePairing {
    /** The secret the CLI exchanges for its token; only its digest is stored. */
    readonly deviceCode: string
    /** The short code the learner types on the web, `XXXX-XXXX`. */
    readonly userCode: string
    /** The web page the learner confirms the code on. */
    readonly verifyUrl: string
    /** The UTC instant the pairing lapses. */
    readonly expiresAt: string
}

/** What the learner sees about a pending pairing before confirming it. */
export interface PairingPreview {
    /** The device name the CLI reported. */
    readonly name: string
    /** The device's platform. */
    readonly platform: RelayPlatform
    /** The UTC instant the pairing lapses. */
    readonly expiresAt: string
}

/** The device token the CLI receives once, after the learner confirmed; only its digest is stored. */
export interface DeviceToken {
    /** The bearer secret of the device. */
    readonly deviceToken: string
}

/** One paired device of a learner as the devices page lists it. */
export interface RelayDevice {
    /** The device id. */
    readonly id: string
    /** The device name. */
    readonly name: string
    /** The device's platform. */
    readonly platform: RelayPlatform
    /** The UTC instant the learner confirmed the pairing. */
    readonly pairedAt: string
    /** The UTC instant the relay last heard from the device, or null. */
    readonly lastSeenAt: string | null
    /** Whether the device's relay socket is open now. */
    readonly online: boolean
}

/** What core answers the relay app for a device token: the device, its learner and whether that learner is Premium now. */
export interface RelayAdmission {
    /** The learner the device belongs to. */
    readonly learnerId: string
    /** The device id. */
    readonly deviceId: string
    /** Whether the learner holds Premium now; the relay gates Premium task checks on it. */
    readonly premium: boolean
}

/** The identity a device token proves: the learner it was paired to and the device itself. */
export interface DevicePrincipal {
    /** The learner the device belongs to. */
    readonly learnerId: string
    /** The device id. */
    readonly deviceId: string
}
