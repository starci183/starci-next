import { Query } from "@nestjs/cqrs"
import type { AgentLabTrackView } from "@modules/domain/agent-lab"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetAgentLabTrackRequest } from "./get-agent-lab-track.contracts"

/** Asks for one track of the lab area on behalf of a signed-in learner. */
export class GetAgentLabTrackQuery extends Query<AgentLabTrackView> {
    constructor(readonly params: ExecuteParams<GetAgentLabTrackRequest>) {
        super()
    }
}
