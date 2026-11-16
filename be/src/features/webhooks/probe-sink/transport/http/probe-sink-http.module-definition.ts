import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { ProbeSinkHttpOptions } from "./probe-sink-http.options"

const built = new ConfigurableModuleBuilder<ProbeSinkHttpOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<ProbeSinkHttpOptions, "register", "create", {}>
/** Defines the probe-sink webhook module registration without owning capability state. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
