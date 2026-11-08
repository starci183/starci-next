import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { NotificationGraphqlOptions } from "./notification-graphql.options"

const built = new ConfigurableModuleBuilder<NotificationGraphqlOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<NotificationGraphqlOptions, "register", "create", {}>
/** Defines the GraphQL transport registration. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
