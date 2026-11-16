import { Module } from "@nestjs/common"
import { ProgressApiModule } from "../../progress.module"
import { LearnerProgressResolver } from "./learner-progress.resolver"
import { ConfigurableModuleClass } from "./progress-graphql.module-definition"

@Module({
    imports: [ProgressApiModule.register({})],
    providers: [LearnerProgressResolver],
})
/** The GraphQL transport of the progress feature: the progress page of the learner. */
export class ProgressGraphqlModule extends ConfigurableModuleClass {}
