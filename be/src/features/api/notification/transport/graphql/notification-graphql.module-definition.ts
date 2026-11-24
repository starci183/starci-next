import { defineConfigurableModule } from "@starci/nest-kit"
import type { NotificationGraphqlOptions } from "./notification-graphql.options"

/** Defines the GraphQL transport registration. */
export const { ConfigurableModuleClass } = defineConfigurableModule<NotificationGraphqlOptions>()
