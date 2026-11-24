import { Module } from "@nestjs/common"
import { LabCli } from "./lab.cli"
import { ConfigurableModuleClass } from "./lab.module-definition"
import { LabStartCli } from "./subs/start.cli"

@Module({ providers: [LabCli, LabStartCli] })
/** The lab group of the learner CLI (`lab start`); the relay client comes from the learner root. */
export class LabCliModule extends ConfigurableModuleClass {}
