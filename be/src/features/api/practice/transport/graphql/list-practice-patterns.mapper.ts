import { toOptionalPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { GuestExecuteParams } from "@modules/platform/cqrs"
import type { ListPracticePatternsRequest } from "../../application/list-practice-patterns.contracts"
import type { PracticePatternsInput } from "./dto/practice-patterns.input"

/** Maps the pattern list of the signed-in learner input and the session to the message params. */
export const toListPracticePatternsParams = (
    identity: IdentityPrincipal | undefined,
    input: PracticePatternsInput,
): GuestExecuteParams<ListPracticePatternsRequest> => ({
    request: { locale: input.locale },
    principal: toOptionalPrincipal(identity),
})
