import type { CodeReadView } from "@modules/domain/project"
import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetProjectCodeReadRequest } from "../../application/get-project-code-read.contracts"
import type { ProjectConceptInput } from "./dto/project-concept.input"
import type { ProjectCodeReadType } from "./dto/project-code-read.type"

/** Maps the input and the session to the message params. */
export const toGetProjectCodeReadParams = (
    identity: IdentityPrincipal,
    input: ProjectConceptInput,
): ExecuteParams<GetProjectCodeReadRequest> => ({
    request: { projectId: input.projectId, conceptId: input.conceptId, locale: input.locale },
    principal: toPrincipal(identity),
})

/** Maps the answer to its GraphQL type. */
export const toGetProjectCodeReadType = (view: CodeReadView | null): ProjectCodeReadType | null => view
