import { defineConfigurableModule } from "@starci/nest-kit"
import type { McpCliOptions } from "./mcp.options"

/** The configurable-module base of the mcp command group. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } = defineConfigurableModule<McpCliOptions>()
