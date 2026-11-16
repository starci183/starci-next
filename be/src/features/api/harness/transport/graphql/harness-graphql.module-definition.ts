import { defineConfigurableModule } from "@starci/nest-kit"
import type { HarnessGraphqlOptions } from "./harness-graphql.options"

/** The configurable-module base of the harness GraphQL transport. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<HarnessGraphqlOptions>()
