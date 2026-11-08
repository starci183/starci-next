import { defineConfigurableModule } from "@starci/nest-kit"
import type { HubGraphqlOptions } from "./hub-graphql.options"

/** The configurable-module base of the hub GraphQL transport. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<HubGraphqlOptions>()
