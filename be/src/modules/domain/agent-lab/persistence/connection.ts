import { AgentLabUsageEntity } from "./entities/agent-lab-usage.entity"
import { InitAgentLab1796400000000 } from "./migrations/1796400000000-init-agent-lab"

/** The entities of the agent lab capability. */
export const agentLabEntities: Array<typeof AgentLabUsageEntity> = [AgentLabUsageEntity]

/** The migrations of the agent lab capability, in the order they run. */
export const agentLabMigrations: Array<typeof InitAgentLab1796400000000> = [InitAgentLab1796400000000]
