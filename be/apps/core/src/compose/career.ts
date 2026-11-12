import type { DynamicModule } from "@nestjs/common"
import {
    CAREER_ERROR_KINDS,
    CAREER_MESSAGES,
    CareerModule,
    careerEntities,
    careerMigrations,
} from "@modules/domain/career"
import {
    AiInterviewClient,
    INTERVIEW_ERROR_KINDS,
    INTERVIEW_MESSAGES,
    InterviewModule,
    interviewEntities,
    interviewMigrations,
} from "@modules/domain/interview"
import { NotificationService } from "@modules/domain/notification"
import {
    AiProjectCoachClient,
    LessonCatalogClient,
    PROJECT_ERROR_KINDS,
    PROJECT_MESSAGES,
    ProjectModule,
    projectEntities,
    projectMigrations,
    UnattestedCiClient,
} from "@modules/domain/project"
import {
    RELAY_ERROR_KINDS,
    RELAY_MESSAGES,
    RelayModule,
    RelayProjectService,
    relayEntities,
    relayMigrations,
} from "@modules/domain/relay"
import { PROBE_ERROR_KINDS, PROBE_MESSAGES, ProbeModule } from "@modules/integrations/probe"
import type { DatabaseConnectionOptions } from "@modules/platform/database"
import type { ErrorKind } from "@modules/platform/errors"
import type { MessageBundle } from "@modules/platform/i18n"
import type { CoreOptions } from "../core.options"

/**
 * The career area: mock interviews, projects with their probes and the device relay (pairing and the feed), and the verified
 * experience they produce.
 * The project probes go through the guarded HTTP transport: public addresses only.
 */
export const careerModules = (options: CoreOptions): Array<DynamicModule> => [
    RelayModule.register({ isGlobal: true, ...options.relay }),
    InterviewModule.register({ isGlobal: true, ...options.interview, coach: AiInterviewClient }),
    CareerModule.register({ isGlobal: true, notifier: NotificationService }),
    ProjectModule.register({
        isGlobal: true,
        ...options.project,
        coach: AiProjectCoachClient,
        relay: RelayProjectService,
        lessons: LessonCatalogClient,
        attestation: UnattestedCiClient,
    }),
    ProbeModule.register({ isGlobal: true, ...options.probe }),
]

/** The error kind tables of the career area. */
export const careerAreaErrorKinds: ReadonlyArray<Readonly<Record<string, ErrorKind>>> = [
    INTERVIEW_ERROR_KINDS,
    CAREER_ERROR_KINDS,
    PROJECT_ERROR_KINDS,
    PROBE_ERROR_KINDS,
    RELAY_ERROR_KINDS,
]

/** The message bundles of the career area. */
export const careerAreaMessages: ReadonlyArray<MessageBundle> = [
    INTERVIEW_MESSAGES,
    CAREER_MESSAGES,
    PROJECT_MESSAGES,
    PROBE_MESSAGES,
    RELAY_MESSAGES,
]

/** The entities the career area keeps in the primary database. */
export const careerAreaEntities: DatabaseConnectionOptions["entities"] = [
    ...interviewEntities,
    ...careerEntities,
    ...projectEntities,
    ...relayEntities,
]

/** The migrations of the career area. */
export const careerAreaMigrations: DatabaseConnectionOptions["migrations"] = [
    ...interviewMigrations,
    ...careerMigrations,
    ...projectMigrations,
    ...relayMigrations,
]
