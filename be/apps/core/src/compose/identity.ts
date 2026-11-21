import type { DynamicModule } from "@nestjs/common"
import { IDENTITY_ERROR_KINDS, IDENTITY_MESSAGES, IdentityModule } from "@modules/domain/identity"
import { LivenessModule } from "@modules/domain/liveness"
import { RelayCredentialAdapter } from "@modules/domain/relay"
import { NOTE_ERROR_KINDS, NoteModule } from "@modules/domain/note"
import { PASSPORT_ERROR_KINDS, type VerifyAccessToken } from "@modules/integrations/passport"
import type { ErrorKind } from "@modules/platform/errors"
import type { MessageBundle } from "@modules/platform/i18n"

/**
 * The identity area: the verifier of the app's own access tokens, the liveness probe and the notes. A paired device's token is the
 * credential of the `@Credential` doors (the relay feed uploads).
 */
export const identityModules = (verifyAccessToken: VerifyAccessToken): Array<DynamicModule> => [
    IdentityModule.register({ isGlobal: true, verifyAccessToken, credentialAuthenticator: RelayCredentialAdapter }),
    LivenessModule.register({ isGlobal: true }),
    NoteModule.register({ isGlobal: true }),
]

/** The error kind tables of the identity area. */
export const identityAreaErrorKinds: ReadonlyArray<Readonly<Record<string, ErrorKind>>> = [
    IDENTITY_ERROR_KINDS,
    NOTE_ERROR_KINDS,
    PASSPORT_ERROR_KINDS,
]

/** The message bundles of the identity area. */
export const identityAreaMessages: ReadonlyArray<MessageBundle> = [IDENTITY_MESSAGES]
