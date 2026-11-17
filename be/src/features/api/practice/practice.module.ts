import { Module } from "@nestjs/common"
import { ListPracticePatternsHandler } from "./application/list-practice-patterns.handler"
import { ListPracticeProblemsHandler } from "./application/list-practice-problems.handler"
import { GetPracticeProblemHandler } from "./application/get-practice-problem.handler"
import { GetPracticeSubmissionHandler } from "./application/get-practice-submission.handler"
import { ListPracticeReadinessHandler } from "./application/list-practice-readiness.handler"
import { RunPracticeHandler } from "./application/run-practice.handler"
import { SubmitPracticeHandler } from "./application/submit-practice.handler"
import { RevealPracticeHintHandler } from "./application/reveal-practice-hint.handler"
import { GetPracticeNextHandler } from "./application/get-practice-next.handler"
import { RevealPracticeSolutionHandler } from "./application/reveal-practice-solution.handler"
import { ConfigurableModuleClass } from "./practice.module-definition"

@Module({
    providers: [
        ListPracticePatternsHandler,
        ListPracticeProblemsHandler,
        GetPracticeProblemHandler,
        GetPracticeSubmissionHandler,
        ListPracticeReadinessHandler,
        RunPracticeHandler,
        SubmitPracticeHandler,
        RevealPracticeHintHandler,
        GetPracticeNextHandler,
        RevealPracticeSolutionHandler,
    ],
})
/** Application handlers of the practice feature: patterns, problems, readiness, the next problem, submissions, the hint ladder and the solution reveal. */
export class PracticeApiModule extends ConfigurableModuleClass {}
