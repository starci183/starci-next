import { defineConfigurableModule } from "@starci/nest-kit"
import type { ProjectGraphqlOptions } from "./project-graphql.options"

/** The configurable-module base of the project GraphQL transport. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<ProjectGraphqlOptions>()
