import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ListPracticeSubmissionsRequest } from "../../application/list-practice-submissions.contracts"
import type { PracticeSubmissionsInput } from "./dto/practice-submissions.input"

/** Maps the submission history input and the session to the message params. */
export const toListPracticeSubmissionsParams = (
    identity: IdentityPrincipal,
    input: PracticeSubmissionsInput,
): ExecuteParams<ListPracticeSubmissionsRequest> => ({
    request: { patternId: input.patternId, locale: input.locale, limit: input.limit, cursor: input.cursor },
    principal: toPrincipal(identity),
})
