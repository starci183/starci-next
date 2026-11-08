import { Module } from "@nestjs/common"
import { ChooseOutcomePathHandler } from "./application/choose-outcome-path.handler"
import { GetOutcomePathsHandler } from "./application/get-outcome-paths.handler"
import { ConfigurableModuleClass } from "./path.module-definition"

@Module({ providers: [GetOutcomePathsHandler, ChooseOutcomePathHandler] })
/** Application handlers of the path feature (the goal layer): the catalog of outcome paths and choosing one. */
export class PathApiModule extends ConfigurableModuleClass {}
