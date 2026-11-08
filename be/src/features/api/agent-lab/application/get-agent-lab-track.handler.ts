import { QueryHandler } from "@nestjs/cqrs"
import { AgentLabReadService, type AgentLabTrackView } from "@modules/domain/agent-lab"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetAgentLabTrackQuery } from "./get-agent-lab-track.query"

@QueryHandler(GetAgentLabTrackQuery)
/** Answers one track with the grid of its labs. */
export class GetAgentLabTrackHandler extends ICQRSHandler<GetAgentLabTrackQuery, AgentLabTrackView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly lab: AgentLabReadService,
    ) {
        super(logger)
    }

    protected override process(query: GetAgentLabTrackQuery): Promise<AgentLabTrackView> {
        return this.lab.track({
            learnerId: query.params.principal.id,
            locale: query.params.request.locale,
            trackId: query.params.request.trackId,
        })
    }
}
