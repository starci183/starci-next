import { Module } from "@nestjs/common"
import { McpCli } from "./mcp.cli"
import { ConfigurableModuleClass } from "./mcp.module-definition"

@Module({ providers: [McpCli] })
/** The mcp command of the learner CLI; the relay client comes from the learner root. */
export class McpCliModule extends ConfigurableModuleClass {}
