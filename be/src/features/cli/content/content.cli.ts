import { Command, CommandRunner } from "nest-commander"
import { SyncContentCli } from "./subs/sync.cli"

@Command({
    name: "content",
    description: "The content repositories (the gitmount)",
    subCommands: [SyncContentCli],
})
/** `cli content`: the content group; its commands are the sub-commands (`cli content sync`). */
export class ContentCli extends CommandRunner {
    /** Without a sub-command the group shows its help. */
    run(): Promise<void> {
        return this.command.help()
    }
}
