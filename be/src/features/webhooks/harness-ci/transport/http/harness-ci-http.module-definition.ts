import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { HarnessCiHttpOptions } from "./harness-ci-http.options"

const built = new ConfigurableModuleBuilder<HarnessCiHttpOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<HarnessCiHttpOptions, "register", "create", {}>
/** Defines the harness-ci webhook module registration without owning capability state. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
