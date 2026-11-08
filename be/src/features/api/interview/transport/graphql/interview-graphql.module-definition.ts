import { defineConfigurableModule } from "@starci/nest-kit"
import type { InterviewGraphqlOptions } from "./interview-graphql.options"

/** The configurable-module base of the interview GraphQL transport. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<InterviewGraphqlOptions>()
