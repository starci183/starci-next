import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { McpOptions } from "./mcp.options"

/** Token of the mcp-owned options. */
export const MCP_OPTIONS: unique symbol = Symbol("domain.mcp.options")

/** Injects the validated mcp options. Parameter type: McpOptions. */
export const InjectMcpOptions = (): TypedParameterDecorator<McpOptions> => injector<McpOptions>(MCP_OPTIONS)
