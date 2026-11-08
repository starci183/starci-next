import type { MilestoneView } from "@modules/domain/project"
import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetProjectMilestoneRequest } from "../../application/get-project-milestone.contracts"
import type { ProjectMilestoneInput } from "./dto/project-milestone.input"
import type { ProjectMilestoneType } from "./dto/project-milestone.type"

/** Maps the input and the session to the message params. */
export const toGetProjectMilestoneParams = (
    identity: IdentityPrincipal,
    input: ProjectMilestoneInput,
): ExecuteParams<GetProjectMilestoneRequest> => ({
    request: { projectId: input.projectId, milestoneId: input.milestoneId, locale: input.locale },
    principal: toPrincipal(identity),
})

/** Maps the answer to its GraphQL type. */
export const toGetProjectMilestoneType = (view: MilestoneView): ProjectMilestoneType => view
