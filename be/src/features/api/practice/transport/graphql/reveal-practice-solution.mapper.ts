import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RevealPracticeSolutionRequest } from "../../application/reveal-practice-solution.contracts"
import type { RevealPracticeSolutionInput } from "./dto/reveal-practice-solution.input"

/** Maps the revealPracticeSolution input and the session to the message params. */
export const toRevealPracticeSolutionParams = (
    identity: IdentityPrincipal,
    input: RevealPracticeSolutionInput,
): ExecuteParams<RevealPracticeSolutionRequest> => ({
    request: { slug: input.slug, locale: input.locale },
    principal: toPrincipal(identity),
})
