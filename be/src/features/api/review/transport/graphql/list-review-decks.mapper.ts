import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ListReviewDecksRequest } from "../../application/list-review-decks.contracts"
import type { RecallDecksInput } from "./dto/recall-decks.input"

/** Maps the reviewDecks input and the session to the message params. */
export const toListReviewDecksParams = (
    identity: IdentityPrincipal,
    input: RecallDecksInput,
): ExecuteParams<ListReviewDecksRequest> => ({
    request: { locale: input.locale, track: input.track },
    principal: { id: identity.subject, role: "authenticated" },
})
