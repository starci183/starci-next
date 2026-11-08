import type { ExperienceReviewItemView } from "@modules/domain/career"
import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetReviewItemRequest } from "../../application/get-review-item.contracts"
import type { ReviewItemInput } from "./dto/review-item.input"
import type { ReviewItemType } from "./dto/review-item.type"

/** Maps the input and the session to the message params. */
export const toGetReviewItemParams = (
    identity: IdentityPrincipal,
    input: ReviewItemInput,
): ExecuteParams<GetReviewItemRequest> => ({
    request: { itemId: input.itemId, roles: identity.roles },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the answer to its GraphQL type. */
export const toGetReviewItemType = (view: ExperienceReviewItemView): ReviewItemType => view
