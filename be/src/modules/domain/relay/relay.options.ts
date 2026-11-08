import type { Secret } from "@modules/platform/config"

/** Options of the relay capability: how long a pairing code lives and how many devices each plan may pair. */
export interface RelayOptions {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
    /** The web page a learner confirms a pairing code on. */
    readonly verifyUrl: string
    /** How long a pairing code stays valid, in seconds. */
    readonly pairingTtlSeconds: number
    /** How many devices a Premium learner may pair at once (Q-R-2). */
    readonly premiumDeviceLimit: number
    /** How many devices a free learner may pair at once (Q-R-2). */
    readonly freeDeviceLimit: number
    /** The sealed Ed25519 PEM manifests are signed with, or null (development and test: a key made per process). */
    readonly manifestSigningKey: Secret | null
    /**
     * The sealed key the relay app presents to core's internal relay doors (`Authorization: Bearer <key>`), or null in
     * development and test without one, where those doors refuse every call.
     */
    readonly serviceKey: Secret | null
}
