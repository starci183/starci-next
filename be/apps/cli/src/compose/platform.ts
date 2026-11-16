import type { DynamicModule } from "@nestjs/common"
import { noteEntities, noteMigrations } from "@modules/domain/note"
import { identityEntities, identityMigrations } from "@modules/domain/identity"
import { entitlementEntities, entitlementMigrations } from "@modules/domain/entitlement"
import { purchaseEntities, purchaseMigrations } from "@modules/domain/purchase"
import { attemptEntities, attemptMigrations } from "@modules/domain/attempt"
import { careerEntities, careerMigrations } from "@modules/domain/career"
import { projectEntities, projectMigrations } from "@modules/domain/project"
import { streakEntities, streakMigrations } from "@modules/domain/streak"
import { harnessEntities, harnessMigrations } from "@modules/domain/harness"
import { pathEntities, pathMigrations } from "@modules/domain/path"
import { notificationEntities, notificationMigrations } from "@modules/domain/notification"
import { lessonEntities, lessonMigrations } from "@modules/domain/lesson"
import { practiceEntities, practiceMigrations } from "@modules/domain/practice"
import { reviewEntities, reviewMigrations } from "@modules/domain/review"
import { relayEntities, relayMigrations } from "@modules/domain/relay"
import { mcpEntities, mcpMigrations } from "@modules/domain/mcp"
import { ClockModule } from "@modules/platform/clock"
import {
    DatabaseModule,
    PRIMARY_ENTITY_MANAGER,
    type DatabaseConnectionConfig,
    type DatabaseConnectionOptions,
} from "@modules/platform/database"
import { HttpModule } from "@modules/platform/http"
import { httpSecurityEntities, httpSecurityMigrations } from "@modules/platform/http-security"
import { InboxModule, inboxEntities, inboxMigrations } from "@modules/platform/inbox"
import { LoggingModule } from "@modules/platform/logging"
import { RetryModule } from "@modules/platform/retry"
import type { CliAppOptions } from "../cli.options"

/** Binds the primary connection to its owners' entities and migrations during composition. */
const primaryConnectionOf = (primary: DatabaseConnectionConfig): DatabaseConnectionOptions => ({
    ...primary,
    entities: [
        ...httpSecurityEntities,
        ...inboxEntities,
        ...noteEntities,
        ...identityEntities,
        ...entitlementEntities,
        ...purchaseEntities,
        ...lessonEntities,
        ...attemptEntities,
        ...careerEntities,
        ...projectEntities,
        ...practiceEntities,
        ...reviewEntities,
        ...streakEntities,
        ...pathEntities,
        ...harnessEntities,
        ...notificationEntities,
        ...relayEntities,
        ...mcpEntities,
    ],
    migrations: [
        ...httpSecurityMigrations,
        ...inboxMigrations,
        ...noteMigrations,
        ...identityMigrations,
        ...entitlementMigrations,
        ...purchaseMigrations,
        ...lessonMigrations,
        ...attemptMigrations,
        ...careerMigrations,
        ...projectMigrations,
        ...practiceMigrations,
        ...reviewMigrations,
        ...streakMigrations,
        ...pathMigrations,
        ...harnessMigrations,
        ...notificationMigrations,
        ...relayMigrations,
        ...mcpMigrations,
    ],
})

/** The clock, logger and declared database connections shared by CLI commands. */
export const platformModules = (options: CliAppOptions): Array<DynamicModule> => [
    ClockModule.register({ isGlobal: true }),
    LoggingModule.register({ isGlobal: true }),
    RetryModule.register({ isGlobal: true }),
    HttpModule.register({ isGlobal: true }),
    DatabaseModule.register({
        isGlobal: true,
        connections: [primaryConnectionOf(options.database)],
    }),
    // The inbox the harness CI service dedupes deliveries with: the cli composes the same HarnessModule as the core api.
    InboxModule.register({ isGlobal: true, connection: PRIMARY_ENTITY_MANAGER }),
]
