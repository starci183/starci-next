import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetReviewItemRequest } from "../../application/get-review-item.contracts"
import type { RecallItemInput } from "./dto/recall-item.input"

/** Maps the reviewItem input and the session to the message params. */
export const toGetReviewItemParams = (
    identity: IdentityPrincipal,
    input: RecallItemInput,
): ExecuteParams<GetReviewItemRequest> => ({
    request: { itemId: input.itemId, locale: input.locale },
    principal: { id: identity.subject, role: "authenticated" },
})
