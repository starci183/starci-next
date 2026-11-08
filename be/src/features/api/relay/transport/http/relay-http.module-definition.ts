import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { RelayHttpOptions } from "./relay-http.options"

const built = new ConfigurableModuleBuilder<RelayHttpOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<RelayHttpOptions, "register", "create", {}>
/** Defines the relay pairing handshake transport registration without owning capability state. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
