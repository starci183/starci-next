import { Module } from "@nestjs/common"
import { AgentLabApiModule } from "../../agent-lab.module"
import { ConfigurableModuleClass } from "./agent-lab-graphql.module-definition"
import { AgentLabResolver } from "./agent-lab.resolver"
import { AgentLabTrackResolver } from "./agent-lab-track.resolver"
import { AgentQuotaResolver } from "./agent-quota.resolver"

@Module({
    imports: [AgentLabApiModule.register({})],
    providers: [AgentLabResolver, AgentLabTrackResolver, AgentQuotaResolver],
})
/** The GraphQL transport of the agent lab feature: the overview, one track and the model-call quota. */
export class AgentLabGraphqlModule extends ConfigurableModuleClass {}
