import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { McpIndexOptions } from "./mcp-index.options"

/** Token of the index-owned options. */
export const MCP_INDEX_OPTIONS: unique symbol = Symbol("domain.mcp.index-options")

/** Injects the validated index options. Parameter type: McpIndexOptions. */
export const InjectMcpIndexOptions = (): TypedParameterDecorator<McpIndexOptions> =>
    injector<McpIndexOptions>(MCP_INDEX_OPTIONS)
