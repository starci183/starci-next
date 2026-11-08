import { Query } from "@nestjs/cqrs"
import type { AgentQuotaView } from "@modules/domain/agent-lab"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetAgentQuotaRequest } from "./get-agent-quota.contracts"

/** Asks for the model-call quota of the signed-in learner for today. */
export class GetAgentQuotaQuery extends Query<AgentQuotaView> {
    constructor(readonly params: ExecuteParams<GetAgentQuotaRequest>) {
        super()
    }
}
