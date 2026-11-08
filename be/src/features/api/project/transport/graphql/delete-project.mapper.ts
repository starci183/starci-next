import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { DeleteProjectRequest } from "../../application/delete-project.contracts"
import type { ProjectDeletedView } from "@modules/domain/project"
import type { DeleteProjectInput } from "./dto/delete-project.input"
import type { ProjectDeletedType } from "./dto/project-deleted.type"

/** Maps the input and the session to the message params. */
export const toDeleteProjectParams = (
    identity: IdentityPrincipal,
    input: DeleteProjectInput,
): ExecuteParams<DeleteProjectRequest> => ({
    request: { projectId: input.projectId },
    principal: toPrincipal(identity),
})

/** Maps the answer to its GraphQL type. */
export const toDeleteProjectType = (view: ProjectDeletedView): ProjectDeletedType => view
