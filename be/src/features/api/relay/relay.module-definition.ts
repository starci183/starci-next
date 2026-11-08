import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { RelayApiOptions } from "./relay.options"

const built = new ConfigurableModuleBuilder<RelayApiOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<RelayApiOptions, "register", "create", {}>
/** Defines the relay handler module registration without owning capability state. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
