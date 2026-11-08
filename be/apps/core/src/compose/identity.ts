import type { DynamicModule } from "@nestjs/common"
import {
    IDENTITY_ERROR_KINDS,
    IDENTITY_MESSAGES,
    IdentityModule,
    identityEntities,
    identityMigrations,
} from "@modules/domain/identity"
import { LivenessModule } from "@modules/domain/liveness"
import { NOTE_ERROR_KINDS, NoteModule, noteEntities, noteMigrations } from "@modules/domain/note"
import { KEYCLOAK_ERROR_KINDS, KEYCLOAK_MESSAGES, KeycloakModule } from "@modules/integrations/keycloak"
import { MAIL_ERROR_KINDS, MailModule } from "@modules/integrations/mail"
import type { DatabaseConnectionOptions } from "@modules/platform/database"
import type { ErrorKind } from "@modules/platform/errors"
import type { MessageBundle } from "@modules/platform/i18n"
import type { CoreOptions } from "../core.options"

/** The identity area: sign-in through Keycloak and its mail, the liveness probe and the notes. */
export const identityModules = (options: CoreOptions): Array<DynamicModule> => [
    IdentityModule.register({ isGlobal: true, ...options.identity }),
    KeycloakModule.register({ isGlobal: true, ...options.keycloak }),
    MailModule.register({ isGlobal: true, ...options.mail }),
    LivenessModule.register({ isGlobal: true }),
    NoteModule.register({ isGlobal: true }),
]

/** The error kind tables of the identity area. */
export const identityAreaErrorKinds: ReadonlyArray<Readonly<Record<string, ErrorKind>>> = [
    IDENTITY_ERROR_KINDS,
    NOTE_ERROR_KINDS,
    KEYCLOAK_ERROR_KINDS,
    MAIL_ERROR_KINDS,
]

/** The message bundles of the identity area. */
export const identityAreaMessages: ReadonlyArray<MessageBundle> = [IDENTITY_MESSAGES, KEYCLOAK_MESSAGES]

/** The entities the identity area keeps in the primary database. */
export const identityAreaEntities: DatabaseConnectionOptions["entities"] = [...noteEntities, ...identityEntities]

/** The migrations of the identity area. */
export const identityAreaMigrations: DatabaseConnectionOptions["migrations"] = [
    ...noteMigrations,
    ...identityMigrations,
]
