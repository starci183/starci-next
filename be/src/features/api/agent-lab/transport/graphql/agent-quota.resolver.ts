import { Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetAgentQuotaQuery } from "../../application/get-agent-quota.query"
import { AgentQuotaType } from "./dto/agent-quota.type"
import { toAgentQuotaType, toGetAgentQuotaParams } from "./get-agent-quota.mapper"

@Resolver()
/** GraphQL door of the daily model-call quota; it needs a session and no Premium. */
export class AgentQuotaResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads how many model calls the learner has left today on the capped proxy key. */
    @Query(() => AgentQuotaType, { name: "agentQuota" })
    async agentQuota(@CurrentPrincipal() identity: IdentityPrincipal): Promise<AgentQuotaType> {
        const result = await this.queryBus.execute(new GetAgentQuotaQuery(toGetAgentQuotaParams(identity)))
        return toAgentQuotaType(result)
    }
}
