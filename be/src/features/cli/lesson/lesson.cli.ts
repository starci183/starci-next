import { Command, CommandRunner } from "nest-commander"
import { ImportLessonsCli } from "./subs/import.cli"

@Command({
    name: "lessons",
    description: "The Lessons content",
    subCommands: [ImportLessonsCli],
})
/** `cli lessons`: the lesson group; its commands are the sub-commands (`cli lessons import`). */
export class LessonCli extends CommandRunner {
    /** Without a sub-command the group shows its help. */
    run(): Promise<void> {
        return this.command.help()
    }
}
