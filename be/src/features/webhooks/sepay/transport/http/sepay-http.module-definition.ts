import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { SepayHttpOptions } from "./sepay-http.options"

const built = new ConfigurableModuleBuilder<SepayHttpOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<SepayHttpOptions, "register", "create", {}>
/** Defines the sepay webhook module registration without owning capability state. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
