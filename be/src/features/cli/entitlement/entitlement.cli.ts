import { Command, CommandRunner } from "nest-commander"
import { DevGrantCli } from "./subs/dev-grant.cli"

@Command({
    name: "entitlement",
    description: "The Premium entitlement (development only)",
    subCommands: [DevGrantCli],
})
/** `cli entitlement`: the entitlement group; its command is the sub-command (`cli entitlement dev-grant`). */
export class EntitlementCli extends CommandRunner {
    /** Without a sub-command the group shows its help. */
    run(): Promise<void> {
        return this.command.help()
    }
}
