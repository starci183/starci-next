import { Module } from "@nestjs/common"
import { GetLearnerHubHandler } from "./application/get-learner-hub.handler"
import { GetStreakHandler } from "./application/get-streak.handler"
import { SetStreakGoalHandler } from "./application/set-streak-goal.handler"
import { ConfigurableModuleClass } from "./hub.module-definition"

@Module({ providers: [GetLearnerHubHandler, GetStreakHandler, SetStreakGoalHandler] })
/** Application handlers of the hub feature: the hub of the learner, the streak and the weekly goal. */
export class HubApiModule extends ConfigurableModuleClass {}
