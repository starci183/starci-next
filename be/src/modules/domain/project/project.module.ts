import { Module, type DynamicModule, type Provider } from "@nestjs/common"
import { LessonCatalogClient } from "./lesson-catalog.client"
import { NoRelayClient } from "./no-relay.client"
import { PROJECT_CI_ATTESTATION } from "./project-ci-attestation.port"
import { ProjectCiService } from "./project-ci.service"
import { ProjectCiProofService } from "./project-ci-proof.service"
import { ProjectCodeReadService } from "./project-code-read.service"
import { PROJECT_COACH } from "./project-coach.port"
import { ProjectEvidenceService } from "./project-evidence.service"
import { ProjectExtrasService } from "./project-extras.service"
import { PROJECT_LESSONS } from "./project-lesson.port"
import { ProjectPracticeService } from "./project-practice.service"
import { ProjectProbeService } from "./project-probe.service"
import { ProjectProbeSinkService } from "./project-probe-sink.service"
import { ProjectCheckSetDiskAdapter } from "./project-check-set-disk.adapter"
import { PROJECT_CHECK_SOURCE } from "./project-check-set.port"
import { ProjectCheckSetService } from "./project-check-set.service"
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
        const checkSourceClass = options.checkSource ?? ProjectCheckSetDiskAdapter
        const bindings: Array<Provider> = [
            { provide: PROJECT_RELAY, useExisting: relayClass },
            { provide: PROJECT_COACH, useExisting: coachClass },
            { provide: PROJECT_LESSONS, useExisting: lessonsClass },
            { provide: PROJECT_CI_ATTESTATION, useExisting: attestationClass },
            { provide: PROJECT_CHECK_SOURCE, useExisting: checkSourceClass },
        ]
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                relayClass,
                coachClass,
                lessonsClass,
                attestationClass,
                checkSourceClass,
                ...bindings,
                ProjectCheckSetService,
                ProjectProbeSinkService,
                ProjectEvidenceService,
                ProjectExtrasService,
                ProjectReadService,
                ProjectService,
                ProjectCiService,
                ProjectCiProofService,
                ProjectProbeService,
                ProjectCodeReadService,
                ProjectPracticeService,
                ProjectRepositoryService,
            ],
            exports: [
                ProjectExtrasService,
                ProjectReadService,
                ProjectService,
                ProjectCiService,
                ProjectCiProofService,
                ProjectProbeService,
                ProjectCodeReadService,
                ProjectPracticeService,
                ProjectRepositoryService,
                ProjectCheckSetService,
                ProjectProbeSinkService,
            ],
        }
    }
}
