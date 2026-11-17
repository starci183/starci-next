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
import { ListPracticeSubmissionsResolver } from "./list-practice-submissions.resolver"
import { GetPracticeNextResolver } from "./get-practice-next.resolver"
import { RevealPracticeSolutionResolver } from "./reveal-practice-solution.resolver"

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
        GetPracticeNextResolver,
        RevealPracticeSolutionResolver,
        ListPracticeSubmissionsResolver,
    ],
})
/** The GraphQL transport of the practice feature: patterns, problems, readiness, the next problem, submissions, the hint ladder, the solution reveal and the submission history. */
export class PracticeGraphqlModule extends ConfigurableModuleClass {}
