import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ListPracticeProblemsRequest } from "../../application/list-practice-problems.contracts"
import type { PracticeProblemsInput } from "./dto/practice-problems.input"

/** Maps the problems of one pattern input and the session to the message params. */
export const toListPracticeProblemsParams = (
    identity: IdentityPrincipal,
    input: PracticeProblemsInput,
): ExecuteParams<ListPracticeProblemsRequest> => ({
    request: { patternId: input.patternId, locale: input.locale },
    principal: toPrincipal(identity),
})
