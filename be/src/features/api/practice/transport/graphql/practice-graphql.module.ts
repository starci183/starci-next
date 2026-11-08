import { Module } from "@nestjs/common"
import { PracticeApiModule } from "../../practice.module"
import { ConfigurableModuleClass } from "./practice-graphql.module-definition"
import { ListPracticePatternsResolver } from "./list-practice-patterns.resolver"
import { ListPracticeProblemsResolver } from "./list-practice-problems.resolver"
import { GetPracticeProblemResolver } from "./get-practice-problem.resolver"
import { GetPracticeSubmissionResolver } from "./get-practice-submission.resolver"
import { ListPracticeReadinessResolver } from "./list-practice-readiness.resolver"
import { RunPracticeResolver } from "./run-practice.resolver"
import { SubmitPracticeResolver } from "./submit-practice.resolver"
import { RevealPracticeHintResolver } from "./reveal-practice-hint.resolver"

@Module({
    imports: [PracticeApiModule.register({})],
    providers: [
        ListPracticePatternsResolver,
        ListPracticeProblemsResolver,
        GetPracticeProblemResolver,
        GetPracticeSubmissionResolver,
        ListPracticeReadinessResolver,
        RunPracticeResolver,
        SubmitPracticeResolver,
        RevealPracticeHintResolver,
    ],
})
/** The GraphQL transport of the practice feature: patterns, problems, readiness, submissions and the hint ladder. */
export class PracticeGraphqlModule extends ConfigurableModuleClass {}
