import type { ConceptView } from "@modules/domain/project"
import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ExplainProjectConceptRequest } from "../../application/explain-project-concept.contracts"
import type { ExplainProjectConceptInput } from "./dto/explain-project-concept.input"
import type { ProjectConceptType } from "./dto/project-concept.type"

/** Maps the input and the session to the message params. */
export const toExplainProjectConceptParams = (
    identity: IdentityPrincipal,
    input: ExplainProjectConceptInput,
): ExecuteParams<ExplainProjectConceptRequest> => ({
    request: {
        projectId: input.projectId,
        conceptId: input.conceptId,
        location: input.location,
        excerpt: input.excerpt,
        explanation: input.explanation,
        locale: input.locale,
    },
    principal: toPrincipal(identity),
})

/** Maps the answer to its GraphQL type. */
export const toExplainProjectConceptType = (view: ConceptView): ProjectConceptType => view
