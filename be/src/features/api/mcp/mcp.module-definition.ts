import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { McpApiOptions } from "./mcp.options"

const built = new ConfigurableModuleBuilder<McpApiOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<McpApiOptions, "register", "create", {}>
/** Defines the mcp handler module registration without owning capability state. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
