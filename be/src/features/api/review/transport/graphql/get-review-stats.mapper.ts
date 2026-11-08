import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetReviewStatsRequest } from "../../application/get-review-stats.contracts"
import type { RecallStatsInput } from "./dto/recall-stats.input"

/** Maps the reviewStats input and the session to the message params. */
export const toGetReviewStatsParams = (
    identity: IdentityPrincipal,
    input: RecallStatsInput,
): ExecuteParams<GetReviewStatsRequest> => ({
    request: { days: input.days },
    principal: { id: identity.subject, role: "authenticated" },
})
