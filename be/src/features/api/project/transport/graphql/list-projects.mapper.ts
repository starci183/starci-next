import type { ProjectSummaryView } from "@modules/domain/project"
import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ListProjectsRequest } from "../../application/list-projects.contracts"
import type { ProjectsInput } from "./dto/projects.input"
import type { ProjectSummaryType } from "./dto/project-summary.type"

/** Maps the input and the session to the message params. */
export const toListProjectsParams = (
    identity: IdentityPrincipal,
    input: ProjectsInput,
): ExecuteParams<ListProjectsRequest> => ({
    request: { locale: input.locale },
    principal: toPrincipal(identity),
})

/** Maps the answer to its GraphQL type. */
export const toListProjectsType = (view: ReadonlyArray<ProjectSummaryView>): ReadonlyArray<ProjectSummaryType> => view
