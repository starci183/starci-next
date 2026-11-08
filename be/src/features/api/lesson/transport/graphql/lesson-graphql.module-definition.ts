import { defineConfigurableModule } from "@starci/nest-kit"
import type { LessonGraphqlOptions } from "./lesson-graphql.options"

/** The configurable-module base of the lesson GraphQL transport. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<LessonGraphqlOptions>()
