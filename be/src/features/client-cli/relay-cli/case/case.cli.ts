import { Command, CommandRunner } from "nest-commander"
import { CaseDiffCli } from "./subs/diff.cli"
import { CaseListCli } from "./subs/list.cli"
import { CaseResetToCli } from "./subs/reset-to.cli"
import { CaseRunCli } from "./subs/run.cli"

@Command({
    name: "case",
    description:
        "The cases of the lab in this folder (starci-lab.yaml, lab@2): list them, run one with every case before it, see the reference fix once green, or reset to the reference rung when stuck",
    subCommands: [CaseListCli, CaseRunCli, CaseDiffCli, CaseResetToCli],
})
/** `starci-relay case`: the group; its commands are the sub-commands (`case list`, `case run`, `case diff`, `case reset-to`). */
export class CaseCli extends CommandRunner {
    /** Without a sub-command the group shows its help. */
    run(): Promise<void> {
        return this.command.help()
    }
}
