import { defineCapabilityModule } from "@starci/nest-kit"
import { MCP_OPTIONS } from "./mcp.decorators"
import type { McpOptions } from "./mcp.options"

/** The configurable-module base of the mcp capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<McpOptions>({
    optionsInjectionToken: MCP_OPTIONS,
})
