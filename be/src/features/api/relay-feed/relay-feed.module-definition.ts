import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { RelayFeedApiOptions } from "./relay-feed.options"

const built = new ConfigurableModuleBuilder<RelayFeedApiOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<RelayFeedApiOptions, "register", "create", {}>
/** Defines the relay feed handler module registration without owning capability state. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
