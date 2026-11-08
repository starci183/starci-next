import type { Secret } from "@modules/platform/config"

/** The registered confidential OIDC client; no deployment address or credential has a fallback. */
export interface KeycloakOptions {
    /** Exact issuer `<origin>/realms/<realm>`: expected in discovery and verified tokens; the admin API is derived from it. */
    readonly issuer: string
    /** Client registration used as the audience; its service account calls the admin API. */
    readonly clientId: string
    /** Mounted custody credential, revealed only for the token and revocation requests. */
    readonly clientSecret: Secret
    /** Exact redirect address registered on the client for the social code flow (the app's callback page). */
    readonly socialCallbackUri: string
    /** Required deadline for every provider request. */
    readonly timeoutMs: number
}

/** The registered client plus whether the module is global; the app root sets it once. */
export interface KeycloakRegistration extends KeycloakOptions {
    /** Whether the module is global. */
    readonly isGlobal: boolean
}

/** What a sign-in at the provider hands the backend; no access token leaves the backend, only the refresh token is kept. */
export interface KeycloakTokens {
    /** The provider's stable user id. */
    readonly subject: string
    /** The roles the verified access token asserts. */
    readonly roles: ReadonlyArray<string>
    /** The email the token asserts, when it carries one. */
    readonly email: string | null
    /** The raw `preferred_username` claim of the verified token, or the account's login name; null when there is none. Untrusted text. */
    readonly username: string | null
    /** The raw `name` claim of the verified token; null when it carries none. Untrusted text. */
    readonly name: string | null
    /** The refresh token the backend keeps server-side. */
    readonly refreshToken: string
    /** When the refresh token stops working. */
    readonly refreshExpiresAt: Date
}

/** The social providers the realm brokers. */
export type SocialProvider = "facebook" | "github"

/** Where a social sign-in sends the browser, and what binds the answer to this transaction. */
export interface SocialAuthorization {
    /** The broker to skip to (kc_idp_hint). */
    readonly provider: SocialProvider
    /** One-use transaction state. */
    readonly state: string
    /** Binds the ID token to the transaction. */
    readonly nonce: string
    /** The S256 challenge of the retained PKCE verifier. */
    readonly codeChallenge: string
}

/** A claimed social callback, exchanged exactly once. */
export interface SocialCodeExchange {
    /** The transient authorization code. */
    readonly code: string
    /** The retained PKCE verifier. */
    readonly codeVerifier: string
    /** The nonce retained with the transaction. */
    readonly nonce: string
}

/** An account to create in the realm. */
export interface NewKeycloakUser {
    /** The address the account is found by and mails go to. */
    readonly email: string
    /** The login name. */
    readonly username: string
    /** The first password, set permanent; it is sent once and never kept. */
    readonly password: string
}

/** An account of the realm as the admin API names it. */
export interface KeycloakAccount {
    /** The provider's stable user id. */
    readonly subject: string
    /** The login name. */
    readonly username: string
}

/** The account an email belongs to, or null when none does. */
export type KeycloakLookup = KeycloakAccount | null

/** The id of a created account. */
export interface KeycloakUserId {
    /** The provider's stable user id. */
    readonly subject: string
}

/** The identity provider as the identity capability sees it: grants, revocation, the broker and the admin API. */
export interface KeycloakGateway {
    /** Password grant; CredentialsRejected or Unavailable. */
    passwordGrant(identifier: string, password: string): Promise<KeycloakTokens>
    /** Refresh grant; CredentialsRejected once the token is expired or revoked. */
    refresh(refreshToken: string): Promise<KeycloakTokens>
    /** Back-channel revocation of a refresh token (RFC 7009). */
    revoke(refreshToken: string): Promise<void>
    /** The provider address a social sign-in sends the browser to, with kc_idp_hint and an S256 challenge. */
    socialAuthorizationUrl(input: SocialAuthorization): Promise<string>
    /** Exchanges a social code once and verifies the ID token; SocialRejected or Unavailable. */
    exchangeSocialCode(input: SocialCodeExchange): Promise<KeycloakTokens>
    /** Creates a verified, enabled account through the admin API; EmailRegistered, PasswordInvalid or Unavailable. */
    createUser(input: NewKeycloakUser): Promise<KeycloakUserId>
    /** Finds an account by its exact email. */
    findUserByEmail(email: string): Promise<KeycloakLookup>
    /** Sets a permanent password; PasswordInvalid. */
    resetPassword(subject: string, password: string): Promise<void>
    /** Ends every provider session of the user. */
    logoutAll(subject: string): Promise<void>
}
