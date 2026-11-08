import { Module, type DynamicModule, type Provider } from "@nestjs/common"
import { LessonCatalogClient } from "./lesson-catalog.client"
import { NoRelayClient } from "./no-relay.client"
import { PROJECT_CI_ATTESTATION } from "./project-ci-attestation.port"
import { ProjectCiService } from "./project-ci.service"
import { ProjectCodeReadService } from "./project-code-read.service"
import { PROJECT_COACH } from "./project-coach.port"
import { ProjectEvidenceService } from "./project-evidence.service"
import { PROJECT_LESSONS } from "./project-lesson.port"
import { ProjectPracticeService } from "./project-practice.service"
import { ProjectProbeService } from "./project-probe.service"
import { ProjectReadService } from "./project-read.service"
import { PROJECT_RELAY } from "./project-relay.port"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./project.module-definition"
import { ProjectService } from "./project.service"
import { ProjectRepositoryService } from "./project-repository.service"
import { UnattestedCiClient } from "./unattested-ci.client"
import { UnconfiguredProjectCoach } from "./unconfigured-project-coach.client"

@Module({})
/** The project capability (the Projects shard): learner projects of any topic, concept milestones, evidence from the machine, signed CI, server probes and the AI teacher. */
export class ProjectModule extends ConfigurableModuleClass {
    /** Registers the services and binds the relay, the AI teacher and the lessons the app names, or the defaults. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        const relayClass = options.relay ?? NoRelayClient
        const coachClass = options.coach ?? UnconfiguredProjectCoach
        const lessonsClass = options.lessons ?? LessonCatalogClient
        const attestationClass = options.attestation ?? UnattestedCiClient
        const bindings: Array<Provider> = [
            { provide: PROJECT_RELAY, useExisting: relayClass },
            { provide: PROJECT_COACH, useExisting: coachClass },
            { provide: PROJECT_LESSONS, useExisting: lessonsClass },
            { provide: PROJECT_CI_ATTESTATION, useExisting: attestationClass },
        ]
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                relayClass,
                coachClass,
                lessonsClass,
                attestationClass,
                ...bindings,
                ProjectEvidenceService,
                ProjectReadService,
                ProjectService,
                ProjectCiService,
                ProjectProbeService,
                ProjectCodeReadService,
                ProjectPracticeService,
                ProjectRepositoryService,
            ],
            exports: [
                ProjectReadService,
                ProjectService,
                ProjectCiService,
                ProjectProbeService,
                ProjectCodeReadService,
                ProjectPracticeService,
                ProjectRepositoryService,
            ],
        }
    }
}
