import type { DynamicModule } from "@nestjs/common"
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
import { careerAreaEntities, careerAreaErrorKinds, careerAreaMessages, careerAreaMigrations } from "./career"
import { commerceAreaEntities, commerceAreaErrorKinds, commerceAreaMessages, commerceAreaMigrations } from "./commerce"
import { identityAreaEntities, identityAreaErrorKinds, identityAreaMessages, identityAreaMigrations } from "./identity"
import { integrationsErrorKinds, integrationsMessages } from "./integrations"
import { learningAreaEntities, learningAreaErrorKinds, learningAreaMessages, learningAreaMigrations } from "./learning"

/**
 * The platform area of the core app: every platform capability, registered once and app-wide, over the catalogs the area groups
 * export (their error kinds, message bundles, entities and migrations). A composition group holds one area's module list and
 * nothing else (no logic, no environment read); `app.module.ts` spreads it into its imports.
 */
export const platformModules = (options: CoreOptions): Array<DynamicModule> => [
    ClockModule.register({ isGlobal: true }),
    RetryModule.register({ isGlobal: true }),
    LoggingModule.register({ isGlobal: true }),
    I18nModule.register({
        isGlobal: true,
        bundles: [
            HTTP_MESSAGES,
            ERRORS_MESSAGES,
            HTTP_SECURITY_MESSAGES,
            ...identityAreaMessages,
            ...commerceAreaMessages,
            ...learningAreaMessages,
            ...careerAreaMessages,
            ...integrationsMessages,
        ],
    }),
    HttpModule.register({ isGlobal: true, ...options.http }),
    ErrorsModule.register({
        isGlobal: true,
        kinds: [
            HTTP_ERROR_KINDS,
            CONFIG_ERROR_KINDS,
            DATABASE_ERROR_KINDS,
            HTTP_SECURITY_ERROR_KINDS,
            ...identityAreaErrorKinds,
            ...commerceAreaErrorKinds,
            ...learningAreaErrorKinds,
            ...careerAreaErrorKinds,
            ...integrationsErrorKinds,
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
                    ...identityAreaEntities,
                    ...commerceAreaEntities,
                    ...learningAreaEntities,
                    ...careerAreaEntities,
                ],
                migrations: [
                    ...httpSecurityMigrations,
                    ...identityAreaMigrations,
                    ...commerceAreaMigrations,
                    ...learningAreaMigrations,
                    ...careerAreaMigrations,
                ],
            },
        ],
    }),
]
