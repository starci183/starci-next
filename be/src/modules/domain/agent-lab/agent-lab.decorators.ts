import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { AgentLabOptions } from "./agent-lab.options"

/** Injection token of the options of the agent lab capability. */
export const AGENT_LAB_OPTIONS: unique symbol = Symbol("domain.agent-lab.options")

/** Injects the options of the agent lab capability. Parameter type: AgentLabOptions. */
export const InjectAgentLabOptions = (): TypedParameterDecorator<AgentLabOptions> =>
    injector<AgentLabOptions>(AGENT_LAB_OPTIONS)
