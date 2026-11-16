import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { McpGraphqlOptions } from "./mcp-graphql.options"

const built = new ConfigurableModuleBuilder<McpGraphqlOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<McpGraphqlOptions, "register", "create", {}>
/** Defines the MCP GraphQL module registration without owning capability state. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
