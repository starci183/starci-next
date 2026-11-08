import type { DynamicModule } from "@nestjs/common"
import { noteEntities, noteMigrations } from "@modules/domain/note"
import { identityEntities, identityMigrations } from "@modules/domain/identity"
import { entitlementEntities, entitlementMigrations } from "@modules/domain/entitlement"
import { purchaseEntities, purchaseMigrations } from "@modules/domain/purchase"
import { agentLabEntities, agentLabMigrations } from "@modules/domain/agent-lab"
import { attemptEntities, attemptMigrations } from "@modules/domain/attempt"
import { interviewEntities, interviewMigrations } from "@modules/domain/interview"
import { careerEntities, careerMigrations } from "@modules/domain/career"
import { projectEntities, projectMigrations } from "@modules/domain/project"
import { streakEntities, streakMigrations } from "@modules/domain/streak"
import { pathEntities, pathMigrations } from "@modules/domain/path"
import { notificationEntities, notificationMigrations } from "@modules/domain/notification"
import { lessonEntities, lessonMigrations } from "@modules/domain/lesson"
import { practiceEntities, practiceMigrations } from "@modules/domain/practice"
import { reviewEntities, reviewMigrations } from "@modules/domain/review"
import { relayEntities, relayMigrations } from "@modules/domain/relay"
import { ClockModule } from "@modules/platform/clock"
import {
    DatabaseModule,
    type DatabaseConnectionConfig,
    type DatabaseConnectionOptions,
} from "@modules/platform/database"
import { HttpModule } from "@modules/platform/http"
import { httpSecurityEntities, httpSecurityMigrations } from "@modules/platform/http-security"
import { LoggingModule } from "@modules/platform/logging"
import { RetryModule } from "@modules/platform/retry"
import type { CliAppOptions } from "../cli.options"

/** Binds the primary connection to its owners' entities and migrations during composition. */
const primaryConnectionOf = (primary: DatabaseConnectionConfig): DatabaseConnectionOptions => ({
    ...primary,
    entities: [
        ...httpSecurityEntities,
        ...noteEntities,
        ...identityEntities,
        ...entitlementEntities,
        ...purchaseEntities,
        ...lessonEntities,
        ...attemptEntities,
        ...interviewEntities,
        ...careerEntities,
        ...projectEntities,
        ...practiceEntities,
        ...reviewEntities,
        ...agentLabEntities,
        ...streakEntities,
        ...pathEntities,
        ...notificationEntities,
        ...relayEntities,
    ],
    migrations: [
        ...httpSecurityMigrations,
        ...noteMigrations,
        ...identityMigrations,
        ...entitlementMigrations,
        ...purchaseMigrations,
        ...lessonMigrations,
        ...attemptMigrations,
        ...interviewMigrations,
        ...careerMigrations,
        ...projectMigrations,
        ...practiceMigrations,
        ...reviewMigrations,
        ...agentLabMigrations,
        ...streakMigrations,
        ...pathMigrations,
        ...notificationMigrations,
        ...relayMigrations,
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
]
