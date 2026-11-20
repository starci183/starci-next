import { toOptionalPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { GuestExecuteParams } from "@modules/platform/cqrs"
import type { GetPracticeProblemRequest } from "../../application/get-practice-problem.contracts"
import type { PracticeProblemInput } from "./dto/practice-problem.input"

/** Maps the one problem to open input and the session to the message params. */
export const toGetPracticeProblemParams = (
    identity: IdentityPrincipal | undefined,
    input: PracticeProblemInput,
): GuestExecuteParams<GetPracticeProblemRequest> => ({
    request: { slug: input.slug, locale: input.locale },
    principal: toOptionalPrincipal(identity),
})
