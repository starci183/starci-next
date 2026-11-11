import { Module } from "@nestjs/common"
import { AttemptApiModule } from "../../attempt.module"
import { ConfigurableModuleClass } from "./attempt-graphql.module-definition"
import { LessonAttemptResolver } from "./lesson-attempt.resolver"
import { LessonProgressResolver } from "./lesson-progress.resolver"
import { SaveLessonSimulationResolver } from "./save-lesson-simulation.resolver"
import { SubmitLessonAttemptResolver } from "./submit-lesson-attempt.resolver"

@Module({
    imports: [AttemptApiModule.register({})],
    providers: [
        SubmitLessonAttemptResolver,
        LessonAttemptResolver,
        LessonProgressResolver,
        SaveLessonSimulationResolver,
    ],
})
/** The GraphQL transport of the attempt feature: submitting an answer, reading an attempt and reading the progress of a lesson. */
export class AttemptGraphqlModule extends ConfigurableModuleClass {}
