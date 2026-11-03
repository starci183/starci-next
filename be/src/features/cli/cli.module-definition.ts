import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { CliOptions } from "./cli.options"

const built = new ConfigurableModuleBuilder<CliOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<CliOptions, "register", "create", {}>
/** The configurable-module base of the cli module. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
export const MODULE_OPTIONS_TOKEN: Host["MODULE_OPTIONS_TOKEN"] = built.MODULE_OPTIONS_TOKEN
export const OPTIONS_TYPE: Host["OPTIONS_TYPE"] = built.OPTIONS_TYPE
