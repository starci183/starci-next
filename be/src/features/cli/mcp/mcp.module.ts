import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./mcp.module-definition"
import { McpCli } from "./mcp.cli"
import { ReindexMcpCli } from "./subs/reindex.cli"

@Module({ providers: [McpCli, ReindexMcpCli] })
/** The mcp group: its command and its sub-command; the work itself is the mcp capability's harness service. */
export class McpCliModule extends ConfigurableModuleClass {}
