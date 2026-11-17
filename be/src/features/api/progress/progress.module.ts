import { Module } from "@nestjs/common"
import { GetLearnerProgressHandler } from "./application/get-learner-progress.handler"
import { ConfigurableModuleClass } from "./progress.module-definition"

@Module({ providers: [GetLearnerProgressHandler] })
/** Application handlers of the progress feature: the progress page of the learner. */
export class ProgressApiModule extends ConfigurableModuleClass {}
