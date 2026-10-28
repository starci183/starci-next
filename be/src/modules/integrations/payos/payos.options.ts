import type { Secret } from "@modules/platform/config"

/** The declared payOS channel credentials this instance verifies deliveries with. */
export interface PayosOptions {
    /** The channel checksum key the inbound webhook signature is verified with; read from custody by name, never logged. */
    readonly checksumKey: Secret
}

/** What the app root hands the payOS capability: the channel the environment declared, or none. */
export interface PayosModuleOptions {
    /** Whether this capability is available app-wide; only an app composition root may pass `true`. */
    readonly isGlobal?: boolean
    /** The declared channel; `null` still composes the rail so every call refuses instead of trusting a channel nobody named. */
    readonly channel: PayosOptions | null
}
