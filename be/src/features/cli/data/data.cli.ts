import { Command, CommandRunner } from "nest-commander"
import { DataDatabaseCli } from "./subs/database.cli"

@Command({
    name: "data",
    description: "The seed doors of the stores the data standard fills",
    subCommands: [DataDatabaseCli],
})
/** `cli data`: the data group; its commands are the sub-commands (`cli data database <verb>`). */
export class DataCli extends CommandRunner {
    /** Without a sub-command the group shows its help. */
    run(): Promise<void> {
        return this.command.help()
    }
}
