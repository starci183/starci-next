import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SetReviewGoalRequest } from "../../application/set-review-goal.contracts"
import type { SetRecallGoalInput } from "./dto/set-recall-goal.input"

/** Maps the setReviewGoal input and the session to the message params. */
export const toSetReviewGoalParams = (
    identity: IdentityPrincipal,
    input: SetRecallGoalInput,
): ExecuteParams<SetReviewGoalRequest> => ({
    request: { daily: input.daily },
    principal: { id: identity.subject, role: "authenticated" },
})
