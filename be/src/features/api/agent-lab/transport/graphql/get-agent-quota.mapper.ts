import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { AgentQuotaView } from "@modules/domain/agent-lab"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetAgentQuotaRequest } from "../../application/get-agent-quota.contracts"
import type { AgentQuotaType } from "./dto/agent-quota.type"

/** Maps the session to the message params of the quota read. */
export const toGetAgentQuotaParams = (identity: IdentityPrincipal): ExecuteParams<GetAgentQuotaRequest> => ({
    request: {},
    principal: toPrincipal(identity),
})

/** Maps the quota to its GraphQL type. */
export const toAgentQuotaType = (result: AgentQuotaView): AgentQuotaType => result
