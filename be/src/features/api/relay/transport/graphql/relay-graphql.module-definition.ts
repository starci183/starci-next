import { defineConfigurableModule } from "@starci/nest-kit"
import type { RelayGraphqlOptions } from "./relay-graphql.options"

/** Defines the relay GraphQL transport registration without owning capability state. */
export const { ConfigurableModuleClass } = defineConfigurableModule<RelayGraphqlOptions>()
