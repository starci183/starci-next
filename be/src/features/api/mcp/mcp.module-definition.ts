import { defineConfigurableModule } from "@starci/nest-kit"
import type { McpApiOptions } from "./mcp.options"

/** Defines the mcp handler module registration without owning capability state. */
export const { ConfigurableModuleClass } = defineConfigurableModule<McpApiOptions>()
