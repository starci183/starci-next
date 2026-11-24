import { defineConfigurableModule } from "@starci/nest-kit"
import type { RelayFeedGraphqlOptions } from "./relay-feed-graphql.options"

/** Defines the relay feed GraphQL transport registration without owning capability state. */
export const { ConfigurableModuleClass } = defineConfigurableModule<RelayFeedGraphqlOptions>()
