import { Module } from "@nestjs/common"
import { GetAgentLabHandler } from "./application/get-agent-lab.handler"
import { GetAgentLabTrackHandler } from "./application/get-agent-lab-track.handler"
import { GetAgentQuotaHandler } from "./application/get-agent-quota.handler"
import { ConfigurableModuleClass } from "./agent-lab.module-definition"

@Module({ providers: [GetAgentLabHandler, GetAgentLabTrackHandler, GetAgentQuotaHandler] })
/** Application handlers of the agent lab feature: the overview, one track and the model-call quota. */
export class AgentLabApiModule extends ConfigurableModuleClass {}
