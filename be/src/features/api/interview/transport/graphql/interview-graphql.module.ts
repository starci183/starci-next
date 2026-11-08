import { Module } from "@nestjs/common"
import { InterviewApiModule } from "../../interview.module"
import { ConfigurableModuleClass } from "./interview-graphql.module-definition"
import { GetInterviewOptionsResolver } from "./get-interview-options.resolver"
import { StartInterviewResolver } from "./start-interview.resolver"
import { AnswerInterviewResolver } from "./answer-interview.resolver"
import { HintInterviewResolver } from "./hint-interview.resolver"
import { RetryInterviewTurnResolver } from "./retry-interview-turn.resolver"
import { SubmitInterviewResolver } from "./submit-interview.resolver"
import { AbandonInterviewResolver } from "./abandon-interview.resolver"
import { GetInterviewSessionResolver } from "./get-interview-session.resolver"
import { RegradeInterviewResolver } from "./regrade-interview.resolver"
import { GetInterviewHistoryResolver } from "./get-interview-history.resolver"
import { GetInterviewEvidenceResolver } from "./get-interview-evidence.resolver"
import { GetInterviewReadinessResolver } from "./get-interview-readiness.resolver"

@Module({
    imports: [InterviewApiModule.register({})],
    providers: [
        GetInterviewOptionsResolver,
        StartInterviewResolver,
        AnswerInterviewResolver,
        HintInterviewResolver,
        RetryInterviewTurnResolver,
        SubmitInterviewResolver,
        AbandonInterviewResolver,
        GetInterviewSessionResolver,
        RegradeInterviewResolver,
        GetInterviewHistoryResolver,
        GetInterviewEvidenceResolver,
        GetInterviewReadinessResolver,
    ],
})
/** The GraphQL transport of the interview feature: 12 doors. */
export class InterviewGraphqlModule extends ConfigurableModuleClass {}
