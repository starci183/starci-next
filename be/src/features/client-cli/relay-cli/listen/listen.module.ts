import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./listen.module-definition"
import { ListenCli } from "./listen.cli"

@Module({ providers: [ListenCli] })
/** The listen command of the learner CLI; the relay client comes from the learner root. */
export class ListenCliModule extends ConfigurableModuleClass {}
