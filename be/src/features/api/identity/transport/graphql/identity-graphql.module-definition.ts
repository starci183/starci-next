import { defineConfigurableModule } from "@starci/nest-kit"
import type { IdentityGraphqlOptions } from "./identity-graphql.options"

/** The configurable-module base of the identity GraphQL transport. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<IdentityGraphqlOptions>()
