import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetReviewTodayRequest } from "../../application/get-review-today.contracts"
import type { RecallTodayInput } from "./dto/recall-today.input"

/** Maps the reviewToday input and the session to the message params. */
export const toGetReviewTodayParams = (
    identity: IdentityPrincipal,
    input: RecallTodayInput,
): ExecuteParams<GetReviewTodayRequest> => ({
    request: { locale: input.locale },
    principal: { id: identity.subject, role: "authenticated" },
})
