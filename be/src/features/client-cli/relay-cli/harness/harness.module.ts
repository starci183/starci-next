import { Module } from "@nestjs/common"
import { HarnessCli } from "./harness.cli"
import { ConfigurableModuleClass } from "./harness.module-definition"
import { HarnessCiReportCli } from "./subs/ci-report.cli"
import { DoctorCli } from "./subs/doctor.cli"
import { HarnessE2eCli } from "./subs/e2e.cli"
import { HarnessPullCli } from "./subs/pull.cli"
import { TrialCli } from "./subs/trial.cli"

@Module({ providers: [HarnessCli, HarnessPullCli, HarnessE2eCli, HarnessCiReportCli, DoctorCli, TrialCli] })
/** The harness group of the learner CLI: its command and its build sub-commands; the relay client comes from the learner root. */
export class HarnessCliModule extends ConfigurableModuleClass {}
