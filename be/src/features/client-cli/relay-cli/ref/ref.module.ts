import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./ref.module-definition"
import { RefCli } from "./ref.cli"

@Module({ providers: [RefCli] })
/** The ref command of the learner CLI; the relay client comes from the learner root. */
export class RefCliModule extends ConfigurableModuleClass {}
