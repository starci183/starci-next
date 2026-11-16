import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./up.module-definition"
import { UpCli } from "./up.cli"

@Module({ providers: [UpCli] })
/** The up command of the learner CLI; the relay client comes from the learner root. */
export class UpCliModule extends ConfigurableModuleClass {}
