import { defineConfigurableModule } from "@starci/nest-kit"
import type { CommerceGraphqlOptions } from "./commerce-graphql.options"

/** Defines the GraphQL transport registration. */
export const { ConfigurableModuleClass } = defineConfigurableModule<CommerceGraphqlOptions>()
