import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./logout.module-definition"
import { LogoutCli } from "./logout.cli"

@Module({ providers: [LogoutCli] })
/** The logout command of the learner CLI; the relay client comes from the learner root. */
export class LogoutCliModule extends ConfigurableModuleClass {}
