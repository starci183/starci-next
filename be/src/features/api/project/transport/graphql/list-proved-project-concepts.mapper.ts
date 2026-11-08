import type { ProvedConceptView } from "@modules/domain/project"
import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ListProvedProjectConceptsRequest } from "../../application/list-proved-project-concepts.contracts"
import type { ProjectProvedConceptType } from "./dto/project-proved-concept.type"

/** Maps the input and the session to the message params. */
export const toListProvedProjectConceptsParams = (
    identity: IdentityPrincipal,
): ExecuteParams<ListProvedProjectConceptsRequest> => ({
    request: {},
    principal: toPrincipal(identity),
})

/** Maps the answer to its GraphQL type. */
export const toListProvedProjectConceptsType = (
    view: ReadonlyArray<ProvedConceptView>,
): ReadonlyArray<ProjectProvedConceptType> => view
