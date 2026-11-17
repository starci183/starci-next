import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./ci-report.module-definition"
import { CiReportCli } from "./ci-report.cli"

@Module({ providers: [CiReportCli] })
/** The ci-report command of the learner CLI; the relay client comes from the learner root. */
export class CiReportCliModule extends ConfigurableModuleClass {}
