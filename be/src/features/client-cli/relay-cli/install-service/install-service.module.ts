import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./install-service.module-definition"
import { InstallServiceCli } from "./install-service.cli"

@Module({ providers: [InstallServiceCli] })
/** The install-service command of the learner CLI; the relay client comes from the learner root. */
export class InstallServiceCliModule extends ConfigurableModuleClass {}
