import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./status.module-definition"
import { StatusCli } from "./status.cli"

@Module({ providers: [StatusCli] })
/** The status command of the learner CLI; the relay client comes from the learner root. */
export class StatusCliModule extends ConfigurableModuleClass {}
