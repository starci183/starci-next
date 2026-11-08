import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { CommerceGraphqlOptions } from "./commerce-graphql.options"

const built = new ConfigurableModuleBuilder<CommerceGraphqlOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<CommerceGraphqlOptions, "register", "create", {}>
/** Defines the GraphQL transport registration. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
