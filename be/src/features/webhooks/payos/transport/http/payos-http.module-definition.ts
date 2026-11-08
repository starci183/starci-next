import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { PayosHttpOptions } from "./payos-http.options"

const built = new ConfigurableModuleBuilder<PayosHttpOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<PayosHttpOptions, "register", "create", {}>
/** Defines the payos webhook module registration without owning capability state. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
