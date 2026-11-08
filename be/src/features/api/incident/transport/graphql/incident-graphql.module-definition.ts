import { defineConfigurableModule } from "@starci/nest-kit"
import type { IncidentGraphqlOptions } from "./incident-graphql.options"

/** The configurable-module base of the incident GraphQL transport. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<IncidentGraphqlOptions>()
