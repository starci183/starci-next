import type { ProjectCatalogView } from "@modules/domain/project"
import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetProjectCatalogRequest } from "../../application/get-project-catalog.contracts"
import type { ProjectCatalogInput } from "./dto/project-catalog.input"
import type { ProjectCatalogType } from "./dto/project-catalog.type"

/** Maps the input and the session to the message params. */
export const toGetProjectCatalogParams = (
    identity: IdentityPrincipal,
    input: ProjectCatalogInput,
): ExecuteParams<GetProjectCatalogRequest> => ({
    request: { locale: input.locale },
    principal: toPrincipal(identity),
})

/** Maps the answer to its GraphQL type. */
export const toGetProjectCatalogType = (view: ProjectCatalogView): ProjectCatalogType => view
