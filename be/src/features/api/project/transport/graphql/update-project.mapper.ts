import type { ProjectSummaryView } from "@modules/domain/project"
import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { UpdateProjectRequest } from "../../application/update-project.contracts"
import type { UpdateProjectInput } from "./dto/update-project.input"
import type { ProjectSummaryType } from "./dto/project-summary.type"

/** Maps the input and the session to the message params. */
export const toUpdateProjectParams = (
    identity: IdentityPrincipal,
    input: UpdateProjectInput,
): ExecuteParams<UpdateProjectRequest> => ({
    request: {
        projectId: input.projectId,
        name: input.name,
        topic: input.topic,
        language: input.language,
        stack: input.stack,
        repoUrl: input.repoUrl,
        deployedUrl: input.deployedUrl,
        locale: input.locale,
    },
    principal: toPrincipal(identity),
})

/** Maps the answer to its GraphQL type. */
export const toUpdateProjectType = (view: ProjectSummaryView): ProjectSummaryType => view
