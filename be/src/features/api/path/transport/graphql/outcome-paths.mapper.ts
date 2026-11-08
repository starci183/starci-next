import type { IdentityPrincipal } from "@modules/domain/identity"
import type { PathCatalogView } from "@modules/domain/path"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ChooseOutcomePathRequest, OutcomePathsRequest } from "../../application/outcome-paths.contracts"
import type { ChooseOutcomePathInput } from "./dto/choose-outcome-path.input"
import type { OutcomePathsInput } from "./dto/outcome-paths.input"
import type { OutcomePathsType } from "./dto/outcome-paths.type"

/** Maps the paths input and the session to the message params. */
export const toOutcomePathsParams = (
    identity: IdentityPrincipal,
    input: OutcomePathsInput,
): ExecuteParams<OutcomePathsRequest> => ({
    request: { locale: input.locale },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the choose input and the session to the message params. */
export const toChooseOutcomePathParams = (
    identity: IdentityPrincipal,
    input: ChooseOutcomePathInput,
): ExecuteParams<ChooseOutcomePathRequest> => ({
    request: { pathId: input.pathId },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the catalog to its GraphQL type, copying the lists the view holds read-only. */
export const toOutcomePathsType = (view: PathCatalogView): OutcomePathsType => ({
    activePathId: view.activePathId,
    paths: view.paths.map((path) => ({
        ...path,
        checks: [...path.checks],
        parts: [...path.parts],
        stages: path.stages.map((stage) => ({ ...stage, steps: [...stage.steps] })),
    })),
})
