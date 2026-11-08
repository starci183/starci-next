import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RevealPracticeHintRequest } from "../../application/reveal-practice-hint.contracts"
import type { RevealPracticeHintInput } from "./dto/reveal-practice-hint.input"

/** Maps the one step of the hint ladder to open input and the session to the message params. */
export const toRevealPracticeHintParams = (
    identity: IdentityPrincipal,
    input: RevealPracticeHintInput,
): ExecuteParams<RevealPracticeHintRequest> => ({
    request: { slug: input.slug, step: input.step, locale: input.locale },
    principal: toPrincipal(identity),
})
