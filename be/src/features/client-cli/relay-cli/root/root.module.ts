import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./root.module-definition"
import { RootCli } from "./root.cli"

@Module({ providers: [RootCli] })
/** The root command of the learner CLI; the relay client comes from the learner root. */
export class RootCliModule extends ConfigurableModuleClass {}
