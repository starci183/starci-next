import { defineConfigurableModule } from "@starci/nest-kit"
import type { PracticeGraphqlOptions } from "./practice-graphql.options"

/** The configurable-module base of the practice GraphQL transport. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<PracticeGraphqlOptions>()
