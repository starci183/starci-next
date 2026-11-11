import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./init.module-definition"
import { InitProjectCli } from "./init.cli"

@Module({ providers: [InitProjectCli] })
/** The init command of the learner CLI; the relay client comes from the learner root. */
export class InitProjectCliModule extends ConfigurableModuleClass {}
