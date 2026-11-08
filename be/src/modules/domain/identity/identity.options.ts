import type { Type } from "@nestjs/common"
import type { Secret } from "@modules/platform/config"
import type { CredentialAuthenticator } from "./credential.contracts"

/** Parsed identity tunables and the session sealing secret; contains no provider registration. */
export interface IdentitySessionOptions {
    /** The local maximum session lifetime in seconds, or null while only the provider's refresh lifetime limits it. */
    readonly sessionMaxSeconds: number | null
    /** How long an emailed-code challenge and a social bundle live, in seconds. */
    readonly challengeTtlSeconds: number
    /** How many wrong codes a challenge tolerates; a resend resets the count. */
    readonly challengeMaxAttempts: number
    /** The secret that seals refresh tokens and challenge payloads at rest and keys the code digests. */
    readonly sessionEncryptionKey: Secret
}

/** The identity capability's tunables and optional app-owned credential authenticator. */
export interface IdentityOptions extends IdentitySessionOptions {
    /** A credential door fails closed while the alternate authenticator is absent. */
    readonly credentialAuthenticator?: Type<CredentialAuthenticator>
}
