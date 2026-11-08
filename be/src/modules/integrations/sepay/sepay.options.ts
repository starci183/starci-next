import type { Secret } from "@modules/platform/config"

/** The declared SePay channel credentials this instance receives IPN deliveries and starts checkouts through. */
export interface SepayOptions {
    /** The IPN secret key SePay's deliveries authenticate with (`x-secret-key`); read from custody by name, never logged. */
    readonly secretKey: Secret
    /** The merchant id the checkout form names (`merchant`). */
    readonly merchantId: string
    /** The secret the checkout form is signed with; read from custody by name, never returned or logged. */
    readonly signingKey: Secret
    /** The absolute URL the checkout form posts to. */
    readonly checkoutUrl: string
}

/** What the app root hands the SePay capability: the channel the environment declared, or none. */
export interface SepayModuleOptions {
    /** Whether this capability is available app-wide; only an app composition root may pass `true`. */
    readonly isGlobal?: boolean
    /** The declared channel; `null` still composes the rail so every call refuses instead of trusting a channel nobody named. */
    readonly channel: SepayOptions | null
}
