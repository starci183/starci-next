import { SetMetadata, applyDecorators, createParamDecorator, type ExecutionContext } from "@nestjs/common"
import { injector, type DoorDecorator, type TypedParameterDecorator } from "@modules/platform/composition"
import { ServerToServer, requestOf } from "@modules/platform/http-security"
import type { CredentialAuthenticator, CredentialMetadata, CredentialPrincipal } from "./credential.contracts"
import { IdentityError, IdentityErrorCode } from "./errors/identity.error"
import { PublicReason, type PublicMetadata } from "./identity.contracts"
import type { IdentityOptions } from "./identity.options"
import type { IdentityPrincipal } from "./session.contracts"

/** Token of the identity-owned lifetime configuration. */
export const IDENTITY_OPTIONS: unique symbol = Symbol("domain.identity.options")

/** Injects validated identity options. Parameter type: IdentityOptions. */
export const InjectIdentityOptions = (): TypedParameterDecorator<IdentityOptions> =>
    injector<IdentityOptions>(IDENTITY_OPTIONS)

/** Metadata key of `@Public`. */
export const PUBLIC_KEY = "domain.identity.public"

/**
 * Opens a door to anonymous callers, stating why; every other door needs a credential or a signed-in caller. A
 * signed webhook proves its caller by its signature, so it owes no browser origin.
 */
export const Public = (metadata: PublicMetadata): DoorDecorator =>
    metadata.reason === PublicReason.SignedWebhook
        ? applyDecorators(SetMetadata(PUBLIC_KEY, metadata), ServerToServer())
        : applyDecorators(SetMetadata(PUBLIC_KEY, metadata))

/** Metadata key of `@Credential`. */
export const CREDENTIAL_KEY: unique symbol = Symbol("domain.identity.credential")

/** Token of the identity-owned port that authenticates an API key, run token, tool token or link token. */
export const CREDENTIAL_AUTHENTICATOR: unique symbol = Symbol("domain.identity.credential-authenticator")

/** Injects the credential authenticator identity was registered with. Parameter type: CredentialAuthenticator. */
export const InjectCredentialAuthenticator = (): TypedParameterDecorator<CredentialAuthenticator> =>
    injector<CredentialAuthenticator>(CREDENTIAL_AUTHENTICATOR)

/**
 * Marks a door authenticated by its own credential; `CredentialGuard` authenticates it and `AuthGuard` admits it. The
 * credential travels in a header no browser attaches by itself, so the door owes no browser origin.
 */
export const Credential = (metadata: CredentialMetadata): DoorDecorator =>
    applyDecorators(SetMetadata(CREDENTIAL_KEY, metadata), ServerToServer())

/** The credential identity `CredentialGuard` established on a `@Credential` door; any other door is unauthenticated. */
export const CurrentCredential: (...dataOrPipes: Array<unknown>) => ParameterDecorator = createParamDecorator(
    (_data: unknown, context: ExecutionContext): CredentialPrincipal => {
        const principal = requestOf(context).credentialPrincipal
        if (!principal) throw new IdentityError({ code: IdentityErrorCode.Unauthenticated })
        return principal
    },
)

/** The signed-in caller `AuthGuard` established; a door that reaches it without session admission is unauthenticated. */
export const CurrentPrincipal: (...dataOrPipes: Array<unknown>) => ParameterDecorator = createParamDecorator(
    (_data: unknown, context: ExecutionContext): IdentityPrincipal => {
        const principal = requestOf(context).identityPrincipal
        if (!principal) throw new IdentityError({ code: IdentityErrorCode.Unauthenticated })
        return principal
    },
)
