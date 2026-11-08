import { Module, type DynamicModule, type Provider } from "@nestjs/common"
import { NoopStreakClient } from "./noop-streak.client"
import { practiceDirectory } from "./practice-directory.client"
import { PracticeHintService } from "./practice-hint.service"
import { PracticeImportService } from "./practice-import.service"
import { PracticeJudgeLanesService } from "./practice-judge-lanes.service"
import { PracticeReadService } from "./practice-read.service"
import { PRACTICE_SOURCE } from "./practice-source.port"
import { PRACTICE_STREAK } from "./practice-streak.port"
import { PracticeSubmissionService } from "./practice-submission.service"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./practice.module-definition"

@Module({})
/** The practice capability (Luyen code): the teacher's problems, runs and submits through the code judge, the hint ladder and the readiness per pattern. */
export class PracticeModule extends ConfigurableModuleClass {
    /** Registers the services and binds the streak the app names, or the one that announces nothing. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        const streakClass = options.streak ?? NoopStreakClient
        const streak: Provider = { provide: PRACTICE_STREAK, useExisting: streakClass }
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                streakClass,
                streak,
                { provide: PRACTICE_SOURCE, useValue: practiceDirectory },
                PracticeJudgeLanesService,
                PracticeImportService,
                PracticeReadService,
                PracticeSubmissionService,
                PracticeHintService,
            ],
            exports: [PracticeImportService, PracticeReadService, PracticeSubmissionService, PracticeHintService],
        }
    }
}
