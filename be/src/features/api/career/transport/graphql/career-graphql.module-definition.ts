import { defineConfigurableModule } from "@starci/nest-kit"
import type { CareerGraphqlOptions } from "./career-graphql.options"

/** The configurable-module base of the career GraphQL transport. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<CareerGraphqlOptions>()
