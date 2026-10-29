import { Module } from "@nestjs/common"
import { ListPlansHandler } from "./application/list-plans.handler"
import { ConfigurableModuleClass } from "./commerce.module-definition"

@Module({ providers: [ListPlansHandler] })
/** Application handlers of the commerce feature: the public Premium offers read. */
export class CommerceModule extends ConfigurableModuleClass {}
