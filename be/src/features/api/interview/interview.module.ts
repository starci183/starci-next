import { Module } from "@nestjs/common"
import { GetInterviewOptionsHandler } from "./application/get-interview-options.handler"
import { StartInterviewHandler } from "./application/start-interview.handler"
import { AnswerInterviewHandler } from "./application/answer-interview.handler"
import { HintInterviewHandler } from "./application/hint-interview.handler"
import { RetryInterviewTurnHandler } from "./application/retry-interview-turn.handler"
import { SubmitInterviewHandler } from "./application/submit-interview.handler"
import { AbandonInterviewHandler } from "./application/abandon-interview.handler"
import { GetInterviewSessionHandler } from "./application/get-interview-session.handler"
import { RegradeInterviewHandler } from "./application/regrade-interview.handler"
import { GetInterviewHistoryHandler } from "./application/get-interview-history.handler"
import { GetInterviewEvidenceHandler } from "./application/get-interview-evidence.handler"
import { GetInterviewReadinessHandler } from "./application/get-interview-readiness.handler"
import { ConfigurableModuleClass } from "./interview.module-definition"

@Module({
    providers: [
        GetInterviewOptionsHandler,
        StartInterviewHandler,
        AnswerInterviewHandler,
        HintInterviewHandler,
        RetryInterviewTurnHandler,
        SubmitInterviewHandler,
        AbandonInterviewHandler,
        GetInterviewSessionHandler,
        RegradeInterviewHandler,
        GetInterviewHistoryHandler,
        GetInterviewEvidenceHandler,
        GetInterviewReadinessHandler,
    ],
})
/** Application handlers of the interview feature: setup, the conversation, the grading, the history and the hiring readiness. */
export class InterviewApiModule extends ConfigurableModuleClass {}
