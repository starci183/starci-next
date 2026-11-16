import { Command, CommandRunner } from "nest-commander"
import { ReindexMcpCli } from "./subs/reindex.cli"

@Command({
    name: "mcp",
    description: "The MCP semantic index",
    subCommands: [ReindexMcpCli],
})
/** `cli mcp`: the mcp group; its command is the sub-command (`cli mcp reindex`). */
export class McpCli extends CommandRunner {
    /** Without a sub-command the group shows its help. */
    run(): Promise<void> {
        return this.command.help()
    }
}
