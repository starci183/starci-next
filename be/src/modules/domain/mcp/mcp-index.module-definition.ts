import { defineCapabilityModule } from "@starci/nest-kit"
import { MCP_INDEX_OPTIONS } from "./mcp-index.decorators"
import type { McpIndexOptions } from "./mcp-index.options"

/** The configurable-module base of the semantic index; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<McpIndexOptions>({
    optionsInjectionToken: MCP_INDEX_OPTIONS,
})
