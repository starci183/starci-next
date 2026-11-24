import { defineConfigurableModule } from "@starci/nest-kit"
import type { McpHttpOptions } from "./mcp-http.options"

/** Defines the MCP endpoint module registration without owning capability state. */
export const { ConfigurableModuleClass } = defineConfigurableModule<McpHttpOptions>()
