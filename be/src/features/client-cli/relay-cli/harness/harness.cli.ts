import { Command, CommandRunner } from "nest-commander"
import { HarnessCiReportCli } from "./subs/ci-report.cli"
import { HarnessE2eCli } from "./subs/e2e.cli"
import { HarnessPullCli } from "./subs/pull.cli"

@Command({
    name: "harness",
    description: "The /harness builds: pull a build, run its e2e stages here, report from GitHub CI",
    subCommands: [HarnessPullCli, HarnessE2eCli, HarnessCiReportCli],
})
/** `starci-next harness`: the group; its commands are the sub-commands (`harness pull`, `harness e2e`, `harness ci-report`). */
export class HarnessCli extends CommandRunner {
    /** Without a sub-command the group shows its help. */
    run(): Promise<void> {
        return this.command.help()
    }
}
