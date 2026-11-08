import type { ReviewQueueView } from "@modules/domain/career"
import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetReviewQueueRequest } from "../../application/get-review-queue.contracts"
import type { ReviewQueueInput } from "./dto/review-queue.input"
import type { ReviewQueueType } from "./dto/review-queue.type"

/** Maps the input and the session to the message params. */
export const toGetReviewQueueParams = (
    identity: IdentityPrincipal,
    input: ReviewQueueInput,
): ExecuteParams<GetReviewQueueRequest> => ({
    request: { tab: input.tab, roles: identity.roles },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the answer to its GraphQL type. */
export const toGetReviewQueueType = (view: ReviewQueueView): ReviewQueueType => view
