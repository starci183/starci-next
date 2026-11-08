import { defineConfigurableModule } from "@starci/nest-kit"
import type { AgentLabGraphqlOptions } from "./agent-lab-graphql.options"

/** The configurable-module base of the agent-lab GraphQL transport. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<AgentLabGraphqlOptions>()
