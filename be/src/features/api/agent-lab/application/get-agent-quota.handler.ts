import { QueryHandler } from "@nestjs/cqrs"
import { AgentLabQuotaService, type AgentQuotaView } from "@modules/domain/agent-lab"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetAgentQuotaQuery } from "./get-agent-quota.query"

@QueryHandler(GetAgentQuotaQuery)
/** Answers the model-call quota of the learner. */
export class GetAgentQuotaHandler extends ICQRSHandler<GetAgentQuotaQuery, AgentQuotaView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly quota: AgentLabQuotaService,
    ) {
        super(logger)
    }

    protected override process(query: GetAgentQuotaQuery): Promise<AgentQuotaView> {
        return this.quota.quota(query.params.principal.id)
    }
}
