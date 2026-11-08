import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { AddReviewDeckRequest } from "../../application/add-review-deck.contracts"
import type { RecallDeckInput } from "./dto/recall-deck.input"

/** Maps the addReviewDeck input and the session to the message params. */
export const toAddReviewDeckParams = (
    identity: IdentityPrincipal,
    input: RecallDeckInput,
): ExecuteParams<AddReviewDeckRequest> => ({
    request: { deckId: input.deckId },
    principal: { id: identity.subject, role: "authenticated" },
})
