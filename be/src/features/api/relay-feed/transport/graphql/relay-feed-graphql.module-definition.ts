import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { RelayFeedGraphqlOptions } from "./relay-feed-graphql.options"

const built = new ConfigurableModuleBuilder<RelayFeedGraphqlOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<RelayFeedGraphqlOptions, "register", "create", {}>
/** Defines the relay feed GraphQL transport registration without owning capability state. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
