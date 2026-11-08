import { defineConfigurableModule } from "@starci/nest-kit"
import type { PathGraphqlOptions } from "./path-graphql.options"

/** The configurable-module base of the path GraphQL transport. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<PathGraphqlOptions>()
