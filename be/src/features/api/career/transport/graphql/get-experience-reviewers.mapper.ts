import type { ReviewerView } from "@modules/domain/career"
import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetExperienceReviewersRequest } from "../../application/get-experience-reviewers.contracts"
import type { ReviewerType } from "./dto/reviewer.type"

/** Maps the input and the session to the message params. */
export const toGetExperienceReviewersParams = (
    identity: IdentityPrincipal,
): ExecuteParams<GetExperienceReviewersRequest> => ({
    request: { roles: identity.roles },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the answer to its GraphQL type. */
export const toGetExperienceReviewersType = (view: ReadonlyArray<ReviewerView>): Array<ReviewerType> => [...view]
