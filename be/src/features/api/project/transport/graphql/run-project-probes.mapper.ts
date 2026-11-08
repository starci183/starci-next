import type { ProbeRunView } from "@modules/domain/project"
import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RunProjectProbesRequest } from "../../application/run-project-probes.contracts"
import type { RunProjectProbesInput } from "./dto/run-project-probes.input"
import type { ProjectProbeRunType } from "./dto/project-probe-run.type"

/** Maps the input and the session to the message params. */
export const toRunProjectProbesParams = (
    identity: IdentityPrincipal,
    input: RunProjectProbesInput,
): ExecuteParams<RunProjectProbesRequest> => ({
    request: { projectId: input.projectId },
    principal: toPrincipal(identity),
})

/** Maps the answer to its GraphQL type. */
export const toRunProjectProbesType = (view: ProbeRunView): ProjectProbeRunType => view
