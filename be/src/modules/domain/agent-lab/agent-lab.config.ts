import type { EnvSource } from "@modules/platform/config"
import { AgentLabError, AgentLabErrorCode } from "./errors/agent-lab.error"
import type { AgentLabOptions } from "./agent-lab.options"

/** The model calls one learner gets through the capped proxy key per UTC day unless the environment names another number. */
export const DEFAULT_AGENT_LAB_DAILY_CALLS = 50

/**
 * Reads the quota of the agent lab from an environment source: `AGENT_LAB_DAILY_CALLS`, a whole number of model calls per
 * learner per UTC day, default 50. A limit of 0 closes the proxy-key labs for everyone; a negative number fails boot.
 */
export const parseAgentLabConfig = (env: EnvSource): Required<Pick<AgentLabOptions, "dailyCalls">> => {
    const dailyCalls = env.int("AGENT_LAB_DAILY_CALLS", DEFAULT_AGENT_LAB_DAILY_CALLS)
    if (dailyCalls < 0) throw new AgentLabError({ code: AgentLabErrorCode.ConfigInvalid })
    return { dailyCalls }
}
