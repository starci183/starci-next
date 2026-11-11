import { Module, type DynamicModule, type Provider } from "@nestjs/common"
import { ATTEMPT_COACH } from "./attempt-coach.port"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./attempt.module-definition"
import { AttemptCompletionService } from "./attempt-completion.service"
import { AttemptFairUseService } from "./attempt-fair-use.service"
import { AttemptProofService } from "./attempt-proof.service"
import { AttemptReadService } from "./attempt-read.service"
import { AttemptService } from "./attempt.service"
import { AttemptSimulationService } from "./attempt-simulation.service"
import { UnconfiguredCoachClient } from "./unconfigured-coach.client"

@Module({})
/** The lesson attempts capability: stored answers, grading, outcome levels and progress. */
export class AttemptModule extends ConfigurableModuleClass {
    /** Registers the attempt services and binds the coach the app names, or the one that grades nothing. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        const coachClass = options.coach ?? UnconfiguredCoachClient
        const coach: Provider = { provide: ATTEMPT_COACH, useExisting: coachClass }
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                coachClass,
                coach,
                AttemptService,
                AttemptCompletionService,
                AttemptReadService,
                AttemptFairUseService,
                AttemptProofService,
                AttemptSimulationService,
            ],
            exports: [
                AttemptService,
                AttemptReadService,
                AttemptFairUseService,
                AttemptProofService,
                AttemptSimulationService,
            ],
        }
    }
}
