import { Command, CommandRunner } from "nest-commander"
import { ImportReviewDecksCli } from "./subs/import.cli"

@Command({
    name: "review",
    description: "The review decks",
    subCommands: [ImportReviewDecksCli],
})
/** `cli review`: the review group; its commands are the sub-commands (`cli review import`). */
export class ReviewCli extends CommandRunner {
    /** Without a sub-command the group shows its help. */
    run(): Promise<void> {
        return this.command.help()
    }
}
