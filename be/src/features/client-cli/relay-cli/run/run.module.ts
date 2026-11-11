import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./run.module-definition"
import { RunTaskCli } from "./run.cli"

@Module({ providers: [RunTaskCli] })
/** The run command of the learner CLI; the relay client comes from the learner root. */
export class RunTaskCliModule extends ConfigurableModuleClass {}
