import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SetProjectRepositoryRequest } from "../../application/set-project-repository.contracts"
import type { SetProjectRepositoryInput } from "./dto/set-project-repository.input"

/** Maps the input and the session to the message params. */
export const toSetProjectRepositoryParams = (
    identity: IdentityPrincipal,
    input: SetProjectRepositoryInput,
): ExecuteParams<SetProjectRepositoryRequest> => ({
    request: { projectId: input.projectId, repository: input.repository },
    principal: toPrincipal(identity),
})
