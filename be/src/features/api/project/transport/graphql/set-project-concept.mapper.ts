import type { ConceptView } from "@modules/domain/project"
import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SetProjectConceptRequest } from "../../application/set-project-concept.contracts"
import type { SetProjectConceptInput } from "./dto/set-project-concept.input"
import type { ProjectConceptType } from "./dto/project-concept.type"

/** Maps the input and the session to the message params. */
export const toSetProjectConceptParams = (
    identity: IdentityPrincipal,
    input: SetProjectConceptInput,
): ExecuteParams<SetProjectConceptRequest> => ({
    request: {
        projectId: input.projectId,
        conceptId: input.conceptId,
        location: input.location,
        endpoint: input.endpoint,
        sampleBody: input.sampleBody,
        locale: input.locale,
    },
    principal: toPrincipal(identity),
})

/** Maps the answer to its GraphQL type. */
export const toSetProjectConceptType = (view: ConceptView): ProjectConceptType => view
