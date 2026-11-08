import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { CheckReviewClozeRequest } from "../../application/check-review-cloze.contracts"
import type { CheckRecallClozeInput } from "./dto/check-recall-cloze.input"

/** Maps the checkReviewCloze input and the session to the message params. */
export const toCheckReviewClozeParams = (
    identity: IdentityPrincipal,
    input: CheckRecallClozeInput,
): ExecuteParams<CheckReviewClozeRequest> => ({
    request: { itemId: input.itemId, n: input.n, choice: input.choice, locale: input.locale },
    principal: { id: identity.subject, role: "authenticated" },
})
