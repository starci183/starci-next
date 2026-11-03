import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { IdentityOptions } from "./identity.options"

const built = new ConfigurableModuleBuilder<IdentityOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<IdentityOptions, "register", "create", {}>
/** Defines the handler module registration without owning capability state. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
