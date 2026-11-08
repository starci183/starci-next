import type { ProjectRepositoryView } from "@modules/domain/project"
import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetProjectRepositoryRequest } from "../../application/get-project-repository.contracts"
import type { ProjectRepositoryInput } from "./dto/project-repository.input"
import type { ProjectRepositoryType } from "./dto/project-repository.type"

/** Maps the input and the session to the message params. */
export const toGetProjectRepositoryParams = (
    identity: IdentityPrincipal,
    input: ProjectRepositoryInput,
): ExecuteParams<GetProjectRepositoryRequest> => ({
    request: { projectId: input.projectId },
    principal: toPrincipal(identity),
})

/** Maps the answer to its GraphQL type. */
export const toProjectRepositoryType = (view: ProjectRepositoryView): ProjectRepositoryType => view
