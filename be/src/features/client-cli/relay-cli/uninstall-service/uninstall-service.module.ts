import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./uninstall-service.module-definition"
import { UninstallServiceCli } from "./uninstall-service.cli"

@Module({ providers: [UninstallServiceCli] })
/** The uninstall-service command of the learner CLI; the relay client comes from the learner root. */
export class UninstallServiceCliModule extends ConfigurableModuleClass {}
