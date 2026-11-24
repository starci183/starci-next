import { Command, CommandRunner } from "nest-commander"
import { LabStartCli } from "./subs/start.cli"

@Command({
    name: "lab",
    description: "The Essentials v2 lab on this machine: start one in the folder you choose",
    subCommands: [LabStartCli],
})
/** `starci-relay lab`: the group; its command is the sub-command `lab start`. */
export class LabCli extends CommandRunner {
    /** Without a sub-command the group shows its help. */
    run(): Promise<void> {
        return this.command.help()
    }
}
