import type { Type } from "@nestjs/common"
import type { CredentialAuthenticator } from "./credential.contracts"

/** Parsed local session lifetimes; contains no provider registration or secret. */
export interface IdentitySessionOptions {
    /** The local maximum session lifetime; its default belongs to the config parser. */
    readonly sessionMaxSeconds: number
    /** The one-use browser transaction lifetime; its default belongs to the config parser. */
    readonly transactionTtlSeconds: number
}

/** The identity capability's lifetimes and optional app-owned credential authenticator. */
export interface IdentityOptions extends IdentitySessionOptions {
    /** A credential door fails closed while the alternate authenticator is absent. */
    readonly credentialAuthenticator?: Type<CredentialAuthenticator>
}
