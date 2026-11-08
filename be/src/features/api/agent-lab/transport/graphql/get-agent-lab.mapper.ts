import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { AgentLabOverviewView } from "@modules/domain/agent-lab"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetAgentLabRequest } from "../../application/get-agent-lab.contracts"
import type { AgentLabInput } from "./dto/agent-lab.input"
import type { AgentLabOverviewType } from "./dto/agent-lab-overview.type"

/** Maps the overview input and the session to the message params. */
export const toGetAgentLabParams = (
    identity: IdentityPrincipal,
    input: AgentLabInput,
): ExecuteParams<GetAgentLabRequest> => ({
    request: { locale: input.locale },
    principal: toPrincipal(identity),
})

/** Maps the overview to its GraphQL type; the schema lists every field a learner may read. */
export const toAgentLabOverviewType = (result: AgentLabOverviewView): AgentLabOverviewType => result
