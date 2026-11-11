import type { DynamicModule } from "@nestjs/common"
import { IDENTITY_ERROR_KINDS, IDENTITY_MESSAGES, IdentityModule, identityEntities } from "@modules/domain/identity"
import { RelayCredentialAdapter } from "@modules/domain/relay"
import { KEYCLOAK_ERROR_KINDS, KEYCLOAK_MESSAGES, KeycloakModule } from "@modules/integrations/keycloak"
import { MAIL_ERROR_KINDS, MailModule } from "@modules/integrations/mail"
import type { DatabaseConnectionOptions } from "@modules/platform/database"
import type { ErrorKind } from "@modules/platform/errors"
import type { MessageBundle } from "@modules/platform/i18n"
import type { RelayAppOptions } from "../relay.options"

/** The identity area of the relay app: the default-deny guards, with a paired device's token as the door credential. */
export const identityModules = (options: RelayAppOptions): Array<DynamicModule> => [
    IdentityModule.register({ isGlobal: true, ...options.identity, credentialAuthenticator: RelayCredentialAdapter }),
    KeycloakModule.register({ isGlobal: true, ...options.keycloak }),
    MailModule.register({ isGlobal: true, ...options.mail }),
]

/** The error kind tables of the identity area. */
export const identityAreaErrorKinds: ReadonlyArray<Readonly<Record<string, ErrorKind>>> = [
    IDENTITY_ERROR_KINDS,
    KEYCLOAK_ERROR_KINDS,
    MAIL_ERROR_KINDS,
]

/** The message bundles of the identity area. */
export const identityAreaMessages: ReadonlyArray<MessageBundle> = [IDENTITY_MESSAGES, KEYCLOAK_MESSAGES]

/** The entities the identity area reads. */
export const identityAreaEntities: DatabaseConnectionOptions["entities"] = [...identityEntities]
