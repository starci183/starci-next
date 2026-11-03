import type { DynamicModule } from "@nestjs/common"
import { IDENTITY_ERROR_KINDS, IDENTITY_MESSAGES, identityEntities, identityMigrations } from "@modules/domain/identity"
import { KEYCLOAK_ERROR_KINDS, KEYCLOAK_MESSAGES } from "@modules/integrations/keycloak"
import { SEPAY_ERROR_KINDS, SEPAY_MESSAGES } from "@modules/integrations/sepay"
import { PAYOS_ERROR_KINDS, PAYOS_MESSAGES } from "@modules/integrations/payos"
import { NOTE_ERROR_KINDS, noteEntities, noteMigrations } from "@modules/domain/note"
import {
    ENTITLEMENT_ERROR_KINDS,
    ENTITLEMENT_MESSAGES,
    entitlementEntities,
    entitlementMigrations,
} from "@modules/domain/entitlement"
import { PURCHASE_ERROR_KINDS, PURCHASE_MESSAGES, purchaseEntities, purchaseMigrations } from "@modules/domain/purchase"
import { ClockModule } from "@modules/platform/clock"
import { CONFIG_ERROR_KINDS } from "@modules/platform/config"
import { CqrsModule } from "@modules/platform/cqrs"
import { DATABASE_ERROR_KINDS, DatabaseModule } from "@modules/platform/database"
import { ERRORS_MESSAGES, ErrorsModule } from "@modules/platform/errors"
import {
    HTTP_SECURITY_ERROR_KINDS,
    HTTP_SECURITY_MESSAGES,
    HttpSecurityModule,
    httpSecurityEntities,
    httpSecurityMigrations,
} from "@modules/platform/http-security"
import { I18nModule } from "@modules/platform/i18n"
import { HTTP_ERROR_KINDS, HTTP_MESSAGES, HttpModule } from "@modules/platform/http"
import { LoggingModule } from "@modules/platform/logging"
import { RetryModule } from "@modules/platform/retry"
import type { CoreOptions } from "../core.options"

/**
 * The platform area of the core app: every platform capability, registered once and app-wide. A composition
 * group holds one area's module list and nothing else (no logic, no environment read); `app.module.ts` spreads it
 * into its imports.
 */
export const platformModules = (options: CoreOptions): Array<DynamicModule> => [
    ClockModule.register({ isGlobal: true }),
    RetryModule.register({ isGlobal: true }),
    LoggingModule.register({ isGlobal: true }),
    HttpModule.register({ isGlobal: true, ...options.http }),
    I18nModule.register({
        isGlobal: true,
        bundles: [
            HTTP_MESSAGES,
            ERRORS_MESSAGES,
            HTTP_SECURITY_MESSAGES,
            IDENTITY_MESSAGES,
            KEYCLOAK_MESSAGES,
            ENTITLEMENT_MESSAGES,
            PURCHASE_MESSAGES,
            SEPAY_MESSAGES,
            PAYOS_MESSAGES,
        ],
    }),
    ErrorsModule.register({
        isGlobal: true,
        kinds: [
            HTTP_ERROR_KINDS,
            CONFIG_ERROR_KINDS,
            DATABASE_ERROR_KINDS,
            HTTP_SECURITY_ERROR_KINDS,
            IDENTITY_ERROR_KINDS,
            NOTE_ERROR_KINDS,
            ENTITLEMENT_ERROR_KINDS,
            PURCHASE_ERROR_KINDS,
            SEPAY_ERROR_KINDS,
            PAYOS_ERROR_KINDS,
            KEYCLOAK_ERROR_KINDS,
        ],
    }),
    CqrsModule.register({ isGlobal: true }),
    HttpSecurityModule.register({ isGlobal: true, ...options.httpSecurity }),
    DatabaseModule.register({
        isGlobal: true,
        connections: [
            {
                ...options.database,
                entities: [
                    ...httpSecurityEntities,
                    ...noteEntities,
                    ...identityEntities,
                    ...entitlementEntities,
                    ...purchaseEntities,
                ],
                migrations: [
                    ...httpSecurityMigrations,
                    ...noteMigrations,
                    ...identityMigrations,
                    ...entitlementMigrations,
                    ...purchaseMigrations,
                ],
            },
        ],
    }),
]
