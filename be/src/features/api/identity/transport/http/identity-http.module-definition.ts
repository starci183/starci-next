import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { IdentityHttpOptions } from "./identity-http.options"

const built = new ConfigurableModuleBuilder<IdentityHttpOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<IdentityHttpOptions, "register", "create", {}>
/** Defines the static session HTTP transport registration. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
