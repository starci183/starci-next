import { Module, type DynamicModule, type Provider } from "@nestjs/common"
import { INTERVIEW_COACH } from "./interview-coach.port"
import { interviewDirectory } from "./interview-directory.client"
import { INTERVIEW_SOURCE } from "./interview-source.port"
import { InterviewAccessService } from "./interview-access.service"
import { InterviewCalibrationService } from "./interview-calibration.service"
import { InterviewCatalogService } from "./interview-catalog.service"
import { InterviewGradingService } from "./interview-grading.service"
import { InterviewHistoryService } from "./interview-history.service"
import { InterviewImportService } from "./interview-import.service"
import { InterviewQuestionService } from "./interview-question.service"
import { InterviewSessionService } from "./interview-session.service"
import { InterviewTurnService } from "./interview-turn.service"
import { DEFAULT_INTERVIEW_SETTINGS } from "./interview.config"
import { INTERVIEW_RESOLVED_OPTIONS } from "./interview.decorators"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./interview.module-definition"
import { UnconfiguredInterviewClient } from "./unconfigured-interview.client"

@Module({})
/** The mock interview capability: banks, sessions, the AI interviewer, the whole-session grader, history and hiring readiness. */
export class InterviewModule extends ConfigurableModuleClass {
    /** Registers the interview services and binds the coach the app names, or the one that asks and grades nothing. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        const coachClass = options.coach ?? UnconfiguredInterviewClient
        const { coach: _coach, isGlobal: _isGlobal, ...given } = options
        const settings = { ...DEFAULT_INTERVIEW_SETTINGS, ...given }
        const providers: Array<Provider> = [
            coachClass,
            { provide: INTERVIEW_COACH, useExisting: coachClass },
            { provide: INTERVIEW_RESOLVED_OPTIONS, useValue: settings },
            { provide: INTERVIEW_SOURCE, useValue: interviewDirectory },
            InterviewAccessService,
            InterviewQuestionService,
            InterviewCatalogService,
            InterviewSessionService,
            InterviewTurnService,
            InterviewGradingService,
            InterviewHistoryService,
            InterviewImportService,
            InterviewCalibrationService,
        ]
        return {
            ...base,
            providers: [...(base.providers ?? []), ...providers],
            exports: [
                InterviewCatalogService,
                InterviewSessionService,
                InterviewTurnService,
                InterviewGradingService,
                InterviewHistoryService,
                InterviewImportService,
                InterviewCalibrationService,
            ],
        }
    }
}
