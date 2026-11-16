import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./down.module-definition"
import { DownCli } from "./down.cli"

@Module({ providers: [DownCli] })
/** The down command of the learner CLI; the relay client comes from the learner root. */
export class DownCliModule extends ConfigurableModuleClass {}
