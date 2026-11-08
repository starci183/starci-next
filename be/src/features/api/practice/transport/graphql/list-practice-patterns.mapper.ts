import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ListPracticePatternsRequest } from "../../application/list-practice-patterns.contracts"
import type { PracticePatternsInput } from "./dto/practice-patterns.input"

/** Maps the pattern list of the signed-in learner input and the session to the message params. */
export const toListPracticePatternsParams = (
    identity: IdentityPrincipal,
    input: PracticePatternsInput,
): ExecuteParams<ListPracticePatternsRequest> => ({
    request: { locale: input.locale },
    principal: toPrincipal(identity),
})
