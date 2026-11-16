import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./pull.module-definition"
import { PullCli } from "./pull.cli"

@Module({ providers: [PullCli] })
/** The pull command of the learner CLI; the relay client comes from the learner root. */
export class PullCliModule extends ConfigurableModuleClass {}
