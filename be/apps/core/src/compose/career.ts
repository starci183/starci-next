import type { DynamicModule } from "@nestjs/common"
import { CAREER_ERROR_KINDS, CAREER_MESSAGES, CareerModule } from "@modules/domain/career"
import { NotificationService } from "@modules/domain/notification"
import { PracticeReadService } from "@modules/domain/practice"
import {
    AiProjectCoachClient,
    LessonCatalogClient,
    PROJECT_ERROR_KINDS,
    PROJECT_MESSAGES,
    ProjectModule,
    GithubOidcClient,
    ProjectCheckSetStoreAdapter,
} from "@modules/domain/project"
import { RELAY_ERROR_KINDS, RELAY_MESSAGES, RelayModule, RelayProjectService } from "@modules/domain/relay"
import { PROBE_ERROR_KINDS, PROBE_MESSAGES, ProbeModule } from "@modules/integrations/probe"
import type { ErrorKind } from "@modules/platform/errors"
import type { MessageBundle } from "@modules/platform/i18n"
import type { CoreOptions } from "../core.options"

/**
 * The career area: projects with their probes and the device relay (pairing and the feed), and the verified
 * experience they produce.
 * The project probes go through the guarded HTTP transport: public addresses only.
 */
export const careerModules = (options: CoreOptions): Array<DynamicModule> => [
    RelayModule.register({ isGlobal: true, ...options.relay }),
    CareerModule.register({ isGlobal: true, notifier: NotificationService, practice: PracticeReadService }),
    ProjectModule.register({
        isGlobal: true,
        ...options.project,
        coach: AiProjectCoachClient,
        relay: RelayProjectService,
        lessons: LessonCatalogClient,
        attestation: GithubOidcClient,
        checkSource: ProjectCheckSetStoreAdapter,
    }),
    ProbeModule.register({ isGlobal: true, ...options.probe }),
]

/** The error kind tables of the career area. */
export const careerAreaErrorKinds: ReadonlyArray<Readonly<Record<string, ErrorKind>>> = [
    CAREER_ERROR_KINDS,
    PROJECT_ERROR_KINDS,
    PROBE_ERROR_KINDS,
    RELAY_ERROR_KINDS,
]

/** The message bundles of the career area. */
export const careerAreaMessages: ReadonlyArray<MessageBundle> = [
    CAREER_MESSAGES,
    PROJECT_MESSAGES,
    PROBE_MESSAGES,
    RELAY_MESSAGES,
]
