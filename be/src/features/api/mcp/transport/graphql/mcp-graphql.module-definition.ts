import { defineConfigurableModule } from "@starci/nest-kit"
import type { McpGraphqlOptions } from "./mcp-graphql.options"

/** Defines the MCP GraphQL module registration without owning capability state. */
export const { ConfigurableModuleClass } = defineConfigurableModule<McpGraphqlOptions>()
