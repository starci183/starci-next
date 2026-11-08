import { Command, CommandRunner } from "nest-commander"
import { EscalateExperienceCli } from "./subs/escalate.cli"
import { SeedExperienceCli } from "./subs/seed.cli"

@Command({
    name: "career",
    description: "The experience items and their review",
    subCommands: [SeedExperienceCli, EscalateExperienceCli],
})
/** `cli career`: the career group; its commands are the sub-commands (`cli career seed`, `cli career escalate`). */
export class CareerCli extends CommandRunner {
    /** Without a sub-command the group shows its help. */
    run(): Promise<void> {
        return this.command.help()
    }
}
