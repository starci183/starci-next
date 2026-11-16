import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { McpHttpOptions } from "./mcp-http.options"

const built = new ConfigurableModuleBuilder<McpHttpOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<McpHttpOptions, "register", "create", {}>
/** Defines the MCP endpoint module registration without owning capability state. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
