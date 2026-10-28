import { Command, CommandRunner } from "nest-commander"
import { ImportLessonsCli } from "./subs/import.cli"

@Command({
    name: "lessons",
    description: "The lesson content of the Academy",
    subCommands: [ImportLessonsCli],
})
/** `cli lessons`: the lessons group; its commands are the sub-commands (`cli lessons import`). */
export class LessonsCli extends CommandRunner {
    /** Without a sub-command the group shows its help. */
    run(): Promise<void> {
        return this.command.help()
    }
}
