import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./mcp-http.module-definition"
import { McpController } from "./mcp.controller"

@Module({ controllers: [McpController] })
/** The Streamable HTTP transport of the StarCi Next MCP server: one endpoint, `/mcp`. */
export class McpHttpModule extends ConfigurableModuleClass {}
