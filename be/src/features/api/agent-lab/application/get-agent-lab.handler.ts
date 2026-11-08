import { QueryHandler } from "@nestjs/cqrs"
import { AgentLabReadService, type AgentLabOverviewView } from "@modules/domain/agent-lab"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetAgentLabQuery } from "./get-agent-lab.query"

@QueryHandler(GetAgentLabQuery)
/** Answers the overview of the lab area. */
export class GetAgentLabHandler extends ICQRSHandler<GetAgentLabQuery, AgentLabOverviewView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly lab: AgentLabReadService,
    ) {
        super(logger)
    }

    protected override process(query: GetAgentLabQuery): Promise<AgentLabOverviewView> {
        return this.lab.overview({ learnerId: query.params.principal.id, locale: query.params.request.locale })
    }
}
