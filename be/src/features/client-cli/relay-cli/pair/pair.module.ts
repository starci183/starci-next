import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./pair.module-definition"
import { PairCli } from "./pair.cli"

@Module({ providers: [PairCli] })
/** The pair command of the learner CLI; the relay client comes from the learner root. */
export class PairCliModule extends ConfigurableModuleClass {}
