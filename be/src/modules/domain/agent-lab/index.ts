/**
 * The agent lab capability (decision.agents.curriculum).
 *
 * `AgentLabReadService` serves the overview (three tracks, the seven mindset concepts) and one track with a cell per concept.
 * The labs are the teacher's: `AgentLabModule.register({ labs })` takes the written labs, each with a status and steps at a pinned
 * tool version, and none exists yet, so every cell is `being-written`. The first concept's labs are free, the rest need Premium.
 * `AgentLabQuotaService` counts the model calls a learner makes through the capped proxy key per UTC day (`AGENT_LAB_DAILY_CALLS`,
 * default 50); the proxy that issues the key is a later item and will call `consume`. The claude track runs on the learner's own account.
 */
export { AGENT_LAB_ERROR_KINDS } from "./errors/agent-lab.error"
export { AGENT_LAB_MESSAGES } from "./messages/agent-lab.messages"
export { AgentLabModule } from "./agent-lab.module"
export { AgentLabQuotaService } from "./agent-lab-quota.service"
export { AgentLabReadService } from "./agent-lab-read.service"
export { parseAgentLabConfig } from "./agent-lab.config"
export { agentLabEntities, agentLabMigrations } from "./persistence/connection"
export type { AgentLabLocale, AgentLabOverviewView, AgentLabTrackView, AgentQuotaView } from "./agent-lab.contracts"
