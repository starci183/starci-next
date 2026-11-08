import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { FlipReviewCardRequest } from "../../application/flip-review-card.contracts"
import type { FlipRecallCardInput } from "./dto/flip-recall-card.input"

/** Maps the flipReviewCard input and the session to the message params. */
export const toFlipReviewCardParams = (
    identity: IdentityPrincipal,
    input: FlipRecallCardInput,
): ExecuteParams<FlipReviewCardRequest> => ({
    request: { itemId: input.itemId, locale: input.locale },
    principal: { id: identity.subject, role: "authenticated" },
})
