import { Command, CommandRunner } from "nest-commander"
import { ImportPracticeCli } from "./subs/import.cli"

@Command({
    name: "practice",
    description: "The Luy\u1ec7n code problems",
    subCommands: [ImportPracticeCli],
})
/** `cli practice`: the practice group; its commands are the sub-commands (`cli practice import`). */
export class PracticeCli extends CommandRunner {
    /** Without a sub-command the group shows its help. */
    run(): Promise<void> {
        return this.command.help()
    }
}
