import { Command, CommandRunner } from "nest-commander"
import { ImportInterviewCli } from "./subs/import.cli"
import { PublishInterviewCli } from "./subs/publish.cli"

@Command({
    name: "interview",
    description: "The mock interview banks",
    subCommands: [ImportInterviewCli, PublishInterviewCli],
})
/** `cli interview`: the interview group; its commands are the sub-commands (`import`, `publish`). */
export class InterviewCli extends CommandRunner {
    /** Without a sub-command the group shows its help. */
    run(): Promise<void> {
        return this.command.help()
    }
}
