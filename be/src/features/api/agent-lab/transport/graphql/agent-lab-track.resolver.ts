import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetAgentLabTrackQuery } from "../../application/get-agent-lab-track.query"
import { AgentLabTrackInput } from "./dto/agent-lab-track.input"
import { AgentLabTrackType } from "./dto/agent-lab-track.type"
import { toAgentLabTrackType, toGetAgentLabTrackParams } from "./get-agent-lab-track.mapper"

@Resolver()
/** GraphQL door of one lab track; it needs a session and no Premium. */
export class AgentLabTrackResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads one track with the grid of its labs. */
    @Query(() => AgentLabTrackType, { name: "agentLabTrack" })
    async agentLabTrack(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: AgentLabTrackInput,
    ): Promise<AgentLabTrackType> {
        const result = await this.queryBus.execute(new GetAgentLabTrackQuery(toGetAgentLabTrackParams(identity, input)))
        return toAgentLabTrackType(result)
    }
}
