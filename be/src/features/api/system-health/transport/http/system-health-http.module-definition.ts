import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { SystemHealthHttpOptions } from "./system-health-http.options"

const built = new ConfigurableModuleBuilder<SystemHealthHttpOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<SystemHealthHttpOptions, "register", "create", {}>
/** The configurable-module base of the system-health-http module. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
export const MODULE_OPTIONS_TOKEN: Host["MODULE_OPTIONS_TOKEN"] = built.MODULE_OPTIONS_TOKEN
export const OPTIONS_TYPE: Host["OPTIONS_TYPE"] = built.OPTIONS_TYPE
