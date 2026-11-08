import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetAgentLabQuery } from "../../application/get-agent-lab.query"
import { AgentLabInput } from "./dto/agent-lab.input"
import { AgentLabOverviewType } from "./dto/agent-lab-overview.type"
import { toAgentLabOverviewType, toGetAgentLabParams } from "./get-agent-lab.mapper"

@Resolver()
/** GraphQL door of the lab area overview; it needs a session and no Premium. */
export class AgentLabResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the tracks and the seven mindset concepts. */
    @Query(() => AgentLabOverviewType, { name: "agentLab" })
    async agentLab(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: AgentLabInput,
    ): Promise<AgentLabOverviewType> {
        const result = await this.queryBus.execute(new GetAgentLabQuery(toGetAgentLabParams(identity, input)))
        return toAgentLabOverviewType(result)
    }
}
