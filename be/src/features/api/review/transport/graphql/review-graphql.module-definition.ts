import { defineConfigurableModule } from "@starci/nest-kit"
import type { ReviewGraphqlOptions } from "./review-graphql.options"

/** The configurable-module base of the review GraphQL transport. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<ReviewGraphqlOptions>()
