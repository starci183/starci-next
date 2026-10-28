import type { Secret } from "@modules/platform/config"

/** The declared payOS channel credentials this instance verifies deliveries and starts checkouts with. */
export interface PayosOptions {
    /** The channel checksum key request and response signatures are computed with; read from custody by name, never logged. */
    readonly checksumKey: Secret
    /** The channel client id sent as `x-client-id`. */
    readonly clientId: string
    /** The channel API key sent as `x-api-key`; read from custody by name, never logged. */
    readonly apiKey: Secret
    /** The origin of the payOS merchant API, without a trailing slash. */
    readonly apiBase: string
    /** How long a payOS call may take before it fails as unavailable. */
    readonly timeoutMs: number
}

/** What the app root hands the payOS capability: the channel the environment declared, or none. */
export interface PayosModuleOptions {
    /** Whether this capability is available app-wide; only an app composition root may pass `true`. */
    readonly isGlobal?: boolean
    /** The declared channel; `null` still composes the rail so every call refuses instead of trusting a channel nobody named. */
    readonly channel: PayosOptions | null
}
