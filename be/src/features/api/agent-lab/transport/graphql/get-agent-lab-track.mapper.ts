import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { AgentLabTrackView } from "@modules/domain/agent-lab"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetAgentLabTrackRequest } from "../../application/get-agent-lab-track.contracts"
import type { AgentLabTrackInput } from "./dto/agent-lab-track.input"
import type { AgentLabTrackType } from "./dto/agent-lab-track.type"

/** Maps the track input and the session to the message params. */
export const toGetAgentLabTrackParams = (
    identity: IdentityPrincipal,
    input: AgentLabTrackInput,
): ExecuteParams<GetAgentLabTrackRequest> => ({
    request: { trackId: input.trackId, locale: input.locale },
    principal: toPrincipal(identity),
})

/** Maps the track to its GraphQL type; the schema lists every field a learner may read. */
export const toAgentLabTrackType = (result: AgentLabTrackView): AgentLabTrackType => result
