import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./prompt.module-definition"
import { PromptCli } from "./prompt.cli"

@Module({ providers: [PromptCli] })
/** The prompt command of the learner CLI; the relay client comes from the learner root. */
export class PromptCliModule extends ConfigurableModuleClass {}
