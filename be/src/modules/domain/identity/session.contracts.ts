import type { KeycloakTokens } from "@modules/integrations/keycloak"

/** A cookie header or opaque credential may be absent for a signed-out caller. */
export type OptionalIdentityReference = string | undefined

/** The verified provider assertions an application session carries. */
export interface IdentityPrincipal {
    /** The provider's stable subject. */
    readonly subject: string
    /** Roles asserted by the verified provider token, without inferred entitlement. */
    readonly roles: ReadonlyArray<string>
    /** The name the header shows (`preferred_username`, else `name` of the verified token), or null. */
    readonly displayName: string | null
    /** The learner's email as the verified token asserted it, or null. */
    readonly email: string | null
}

/** The authenticated read representation; no credential leaves this boundary. */
export interface IdentitySessionView {
    /** The verified provider assertions. */
    readonly identity: IdentityPrincipal
    /** The effective application expiry in RFC3339 UTC. */
    readonly expiresAt: string
}

/** What the provider verified and the session store keeps for one learner. */
export interface SessionTokens {
    /** The provider's stable subject. */
    readonly subject: string
    /** Roles asserted by the verified provider token. */
    readonly roles: ReadonlyArray<string>
    /** The cleaned display name of the learner, or null. */
    readonly displayName: string | null
    /** The cleaned email of the learner, or null. */
    readonly email: string | null
    /** The provider refresh token, sealed at rest and never sent to the browser. */
    readonly refreshToken: string
    /** When the refresh token stops working. */
    readonly refreshExpiresAt: Date
}

/** A durable session just created; the reference is the raw cookie value and exists nowhere else in clear. */
export interface SessionIssued {
    /** The raw opaque cookie value. */
    readonly reference: string
    /** The effective end of the session. */
    readonly expiresAt: Date
    /** Whole seconds from issue to `expiresAt`, for the cookie's Max-Age. */
    readonly maxAgeSeconds: number
}

/** A refresh the provider granted. */
export interface RenewedTokens {
    /** Discriminant of the granted half. */
    readonly kind: "renewed"
    /** The new tokens. */
    readonly tokens: KeycloakTokens
}

/** A refresh that failed, with the cause for the caller to judge. */
export interface FailedRenewal {
    /** Discriminant of the failed half. */
    readonly kind: "failed"
    /** The caught failure. */
    readonly cause: unknown
}

/** The provider's answer to a refresh. */
export type RenewOutcome = RenewedTokens | FailedRenewal
