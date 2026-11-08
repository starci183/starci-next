import { defineConfigurableModule } from "@starci/nest-kit"
import type { AttemptGraphqlOptions } from "./attempt-graphql.options"

/** The configurable-module base of the attempt GraphQL transport. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<AttemptGraphqlOptions>()
