import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { CommerceOptions } from "./commerce.options"

const built = new ConfigurableModuleBuilder<CommerceOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<CommerceOptions, "register", "create", {}>
/** Defines the handler module registration without owning capability state. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
