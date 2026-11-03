import type { Secret } from "@modules/platform/config"

/** The registered confidential OIDC client; no deployment address or credential has a fallback. */
export interface KeycloakOptions {
    /** Exact issuer expected in discovery and verified identity tokens. */
    readonly issuer: string
    /** Client registration used as the audience. */
    readonly clientId: string
    /** Mounted custody credential, revealed only for the token request. */
    readonly clientSecret: Secret
    /** Exact registered backend callback. */
    readonly callbackUri: string
    /** Exact registered application return after logout. */
    readonly postLogoutUri: string
    /** Required deadline for every provider request. */
    readonly timeoutMs: number
}
