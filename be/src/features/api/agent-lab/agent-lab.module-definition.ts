import { defineConfigurableModule } from "@starci/nest-kit"
import type { AgentLabApiOptions } from "./agent-lab.options"

/** The configurable-module base of the agent-lab feature module. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<AgentLabApiOptions>()
