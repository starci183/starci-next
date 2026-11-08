import { Module } from "@nestjs/common"
import { HubApiModule } from "../../hub.module"
import { ConfigurableModuleClass } from "./hub-graphql.module-definition"
import { LearnerHubResolver } from "./learner-hub.resolver"
import { SetStreakGoalResolver } from "./set-streak-goal.resolver"
import { StreakResolver } from "./streak.resolver"

@Module({
    imports: [HubApiModule.register({})],
    providers: [LearnerHubResolver, StreakResolver, SetStreakGoalResolver],
})
/** The GraphQL transport of the hub feature: the hub of the learner, the streak and the weekly goal. */
export class HubGraphqlModule extends ConfigurableModuleClass {}
