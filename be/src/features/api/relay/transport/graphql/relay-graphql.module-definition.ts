import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { RelayGraphqlOptions } from "./relay-graphql.options"

const built = new ConfigurableModuleBuilder<RelayGraphqlOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<RelayGraphqlOptions, "register", "create", {}>
/** Defines the relay GraphQL transport registration without owning capability state. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
