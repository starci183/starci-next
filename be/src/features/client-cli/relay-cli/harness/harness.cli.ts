import { Command, CommandRunner } from "nest-commander"
import { HarnessCiReportCli } from "./subs/ci-report.cli"
import { DoctorCli } from "./subs/doctor.cli"
import { HarnessE2eCli } from "./subs/e2e.cli"
import { HarnessPullCli } from "./subs/pull.cli"
import { TrialCli } from "./subs/trial.cli"

@Command({
    name: "harness",
    description: "The /harness commands: pull a build, run its e2e stages here, report from GitHub CI, check your tool setup (doctor) and test it on a trap repo (trial)",
    subCommands: [HarnessPullCli, HarnessE2eCli, HarnessCiReportCli, DoctorCli, TrialCli],
})
/** `starci-next harness`: the group; its commands are the sub-commands (`harness pull`, `harness e2e`, `harness ci-report`, `harness doctor`, `harness trial`). */
export class HarnessCli extends CommandRunner {
    /** Without a sub-command the group shows its help. */
    run(): Promise<void> {
        return this.command.help()
    }
}
