import { Query } from "@nestjs/cqrs"
import type { AgentLabOverviewView } from "@modules/domain/agent-lab"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetAgentLabRequest } from "./get-agent-lab.contracts"

/** Asks for the overview of the lab area on behalf of a signed-in learner. */
export class GetAgentLabQuery extends Query<AgentLabOverviewView> {
    constructor(readonly params: ExecuteParams<GetAgentLabRequest>) {
        super()
    }
}
