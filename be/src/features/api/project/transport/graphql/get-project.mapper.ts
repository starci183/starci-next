import type { ProjectView } from "@modules/domain/project"
import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetProjectRequest } from "../../application/get-project.contracts"
import type { ProjectInput } from "./dto/project.input"
import type { ProjectDetailType } from "./dto/project-detail.type"

/** Maps the input and the session to the message params. */
export const toGetProjectParams = (
    identity: IdentityPrincipal,
    input: ProjectInput,
): ExecuteParams<GetProjectRequest> => ({
    request: { projectId: input.projectId, locale: input.locale },
    principal: toPrincipal(identity),
})

/** Maps the answer to its GraphQL type. */
export const toGetProjectType = (view: ProjectView): ProjectDetailType => view
