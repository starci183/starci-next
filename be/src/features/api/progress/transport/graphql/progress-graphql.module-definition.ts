import { defineConfigurableModule } from "@starci/nest-kit"
import type { ProgressGraphqlOptions } from "./progress-graphql.options"

/** The configurable-module base of the progress GraphQL transport. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<ProgressGraphqlOptions>()
