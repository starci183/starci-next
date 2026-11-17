import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetReviewDeckRequest } from "../../application/get-review-deck.contracts"
import type { RecallDeckDetailInput } from "./dto/recall-deck-detail.input"

/** Maps the reviewDeck input and the session to the message params. */
export const toGetReviewDeckParams = (
    identity: IdentityPrincipal,
    input: RecallDeckDetailInput,
): ExecuteParams<GetReviewDeckRequest> => ({
    request: { deckId: input.deckId, locale: input.locale },
    principal: toPrincipal(identity),
})
