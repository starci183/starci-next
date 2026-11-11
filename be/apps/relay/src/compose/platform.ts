import type { DynamicModule } from "@nestjs/common"
import { ClockModule } from "@modules/platform/clock"
import { CONFIG_ERROR_KINDS } from "@modules/platform/config"
import { CqrsModule } from "@modules/platform/cqrs"
import { DATABASE_ERROR_KINDS, DatabaseModule } from "@modules/platform/database"
import { ERRORS_MESSAGES, ErrorsModule } from "@modules/platform/errors"
import { GraphqlModule } from "@modules/platform/graphql"
import {
    HTTP_SECURITY_ERROR_KINDS,
    HTTP_SECURITY_MESSAGES,
    HttpSecurityModule,
    httpSecurityEntities,
} from "@modules/platform/http-security"
import { I18nModule } from "@modules/platform/i18n"
import { HTTP_ERROR_KINDS, HTTP_MESSAGES, HttpModule } from "@modules/platform/http"
import { LoggingModule } from "@modules/platform/logging"
import { REALTIME_ERROR_KINDS, RealtimeModule } from "@modules/platform/realtime"
import { RetryModule } from "@modules/platform/retry"
import type { RelayAppOptions } from "../relay.options"
import { identityAreaEntities, identityAreaErrorKinds, identityAreaMessages } from "./identity"
import { relayAreaEntities, relayAreaErrorKinds, relayAreaMessages } from "./relay"

/**
 * The platform area of the relay app: the platform capabilities over the catalogs of its areas, the realtime hub its socket
 * reads and the GraphQL server of its upload doors. It runs no migration: core's cli owns the schema.
 */
export const platformModules = (options: RelayAppOptions): Array<DynamicModule> => [
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
            ...identityAreaMessages,
            ...relayAreaMessages,
        ],
    }),
    ErrorsModule.register({
        isGlobal: true,
        kinds: [
            HTTP_ERROR_KINDS,
            CONFIG_ERROR_KINDS,
            DATABASE_ERROR_KINDS,
            HTTP_SECURITY_ERROR_KINDS,
            REALTIME_ERROR_KINDS,
            ...identityAreaErrorKinds,
            ...relayAreaErrorKinds,
        ],
    }),
    CqrsModule.register({ isGlobal: true }),
    HttpSecurityModule.register({ isGlobal: true, ...options.httpSecurity }),
    DatabaseModule.register({
        isGlobal: true,
        connections: [
            {
                ...options.database,
                entities: [...httpSecurityEntities, ...identityAreaEntities, ...relayAreaEntities],
                migrations: [],
            },
        ],
    }),
    RealtimeModule.register({ isGlobal: true, ...options.realtime }),
    GraphqlModule.register({ isGlobal: true }),
]
