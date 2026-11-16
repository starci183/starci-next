import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./check.module-definition"
import { CheckCli } from "./check.cli"

@Module({ providers: [CheckCli] })
/** The check command of the learner CLI; the relay client comes from the learner root. */
export class CheckCliModule extends ConfigurableModuleClass {}
