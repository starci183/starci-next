import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SubmitReviewRetrievalRequest } from "../../application/submit-review-retrieval.contracts"
import type { SubmitRecallRetrievalInput } from "./dto/submit-recall-retrieval.input"

/** Maps the submitReviewRetrieval input and the session to the message params. */
export const toSubmitReviewRetrievalParams = (
    identity: IdentityPrincipal,
    input: SubmitRecallRetrievalInput,
): ExecuteParams<SubmitReviewRetrievalRequest> => ({
    request: { itemId: input.itemId, revision: input.revision, text: input.text, locale: input.locale },
    principal: { id: identity.subject, role: "authenticated" },
})
