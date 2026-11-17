import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetPracticeNextRequest } from "../../application/get-practice-next.contracts"
import type { PracticeNextInput } from "./dto/practice-next.input"

/** Maps the practiceNext input and the session to the message params. */
export const toGetPracticeNextParams = (
    identity: IdentityPrincipal,
    input: PracticeNextInput,
): ExecuteParams<GetPracticeNextRequest> => ({
    request: { patternId: input.patternId, locale: input.locale },
    principal: toPrincipal(identity),
})
