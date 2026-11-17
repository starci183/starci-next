import { defineConfigurableModule } from "@starci/nest-kit"
import type { ProfileGraphqlOptions } from "./profile-graphql.options"

/** The configurable-module base of the profile GraphQL transport. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<ProfileGraphqlOptions>()
