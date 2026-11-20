import type { DynamicModule, Provider } from "@nestjs/common"
import { AI_GATEWAY_ERROR_KINDS, AI_GATEWAY_MESSAGES, AiGatewayModule } from "@modules/integrations/ai-gateway"
import { MailModule } from "@modules/integrations/mail"
import {
    OWN_TOKEN_VERIFIER,
    PASSPORT_AUTHENTICATOR,
    PASSPORT_OPTIONS,
    PassportModule,
    type VerifyAccessToken,
} from "@modules/integrations/passport"
import { OBJECT_STORAGE_ERROR_KINDS, ObjectStorageModule } from "@modules/integrations/object-storage"
import type { ErrorKind } from "@modules/platform/errors"
import type { MessageBundle } from "@modules/platform/i18n"
import type { CoreOptions } from "../core.options"

/**
 * The provider integrations several areas share, registered once and app-wide (each area composes its own providers). Without a
 * declared OpenRouter key the gateway still composes and refuses, so a written answer is saved and not graded.
 */
export const integrationsModules = (options: CoreOptions): Array<DynamicModule> => [
    // The sign-in of the app: it signs its own access tokens and serves its JWKS, with the mail its confirm and reset links go out through.
    PassportModule.register({ ...options.passport, authenticator: PASSPORT_AUTHENTICATOR, isGlobal: true }),
    MailModule.register({ ...options.mail, isGlobal: true }),
    AiGatewayModule.register({ isGlobal: true, gateway: options.aiGateway }),
    ObjectStorageModule.register({ ...options.objectStorage, isGlobal: true }),
]

/** The error kind tables of the shared integrations. */
export const integrationsErrorKinds: ReadonlyArray<Readonly<Record<string, ErrorKind>>> = [
    AI_GATEWAY_ERROR_KINDS,
    OBJECT_STORAGE_ERROR_KINDS,
]

/** The message bundles of the shared integrations. */
export const integrationsMessages: ReadonlyArray<MessageBundle> = [AI_GATEWAY_MESSAGES]

/** The passport ports bound once for this app: its options and the verifier of its own access tokens. */
export const integrationsProviders = (options: CoreOptions, verifyAccessToken: VerifyAccessToken): Array<Provider> => [
    { provide: PASSPORT_OPTIONS, useValue: options.passport },
    { provide: OWN_TOKEN_VERIFIER, useValue: verifyAccessToken },
]
