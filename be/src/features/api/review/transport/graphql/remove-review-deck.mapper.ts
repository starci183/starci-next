import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RemoveReviewDeckRequest } from "../../application/remove-review-deck.contracts"
import type { RecallDeckInput } from "./dto/recall-deck.input"

/** Maps the removeReviewDeck input and the session to the message params. */
export const toRemoveReviewDeckParams = (
    identity: IdentityPrincipal,
    input: RecallDeckInput,
): ExecuteParams<RemoveReviewDeckRequest> => ({
    request: { deckId: input.deckId },
    principal: { id: identity.subject, role: "authenticated" },
})
