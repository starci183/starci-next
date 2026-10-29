import { SetMetadata } from "@nestjs/common"
import { injector } from "@modules/platform/composition"
import type { TypedParameterDecorator } from "@modules/platform/composition"
import type { CredentialAuthenticator, CredentialMetadata } from "./credential.contracts"
import type { PublicMetadata } from "./identity.contracts"
import type { IdentityOptions } from "./identity.options"

/** Token of the identity-owned lifetime configuration. */
export const IDENTITY_OPTIONS: unique symbol = Symbol("domain.identity.options")

/** Injects validated identity options. Parameter type: IdentityOptions. */
export const InjectIdentityOptions = (): TypedParameterDecorator<IdentityOptions> =>
    injector<IdentityOptions>(IDENTITY_OPTIONS)

/** Metadata key of `@Public`. */
export const PUBLIC_KEY = "domain.identity.public"

/** Opens a door to anonymous callers, stating why; every other door needs a credential or a signed-in caller. */
export const Public = (metadata: PublicMetadata): ReturnType<typeof SetMetadata> => SetMetadata(PUBLIC_KEY, metadata)

/** Metadata key of `@Credential`. */
export const CREDENTIAL_KEY: unique symbol = Symbol("domain.identity.credential")

/** Token of the identity-owned port that authenticates an API key, run token, tool token or link token. */
export const CREDENTIAL_AUTHENTICATOR: unique symbol = Symbol("domain.identity.credential-authenticator")

/** Injects the credential authenticator identity was registered with. Parameter type: CredentialAuthenticator. */
export const InjectCredentialAuthenticator = (): TypedParameterDecorator<CredentialAuthenticator> =>
    injector<CredentialAuthenticator>(CREDENTIAL_AUTHENTICATOR)

/** Marks a door authenticated by its own credential; `CredentialGuard` authenticates it and `AuthGuard` admits it. */
export const Credential = (metadata: CredentialMetadata): ReturnType<typeof SetMetadata> =>
    SetMetadata(CREDENTIAL_KEY, metadata)
