import { defineCapabilityModule } from "@starci/nest-kit"
import { AGENT_LAB_OPTIONS } from "./agent-lab.decorators"
import type { AgentLabOptions } from "./agent-lab.options"

/** The configurable-module base of the agent lab capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<AgentLabOptions>({
    optionsInjectionToken: AGENT_LAB_OPTIONS,
})
