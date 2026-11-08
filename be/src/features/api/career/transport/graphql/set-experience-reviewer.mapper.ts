import type { ReviewerView } from "@modules/domain/career"
import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SetExperienceReviewerRequest } from "../../application/set-experience-reviewer.contracts"
import type { SetExperienceReviewerInput } from "./dto/set-experience-reviewer.input"
import type { ReviewerType } from "./dto/reviewer.type"

/** Maps the input and the session to the message params. */
export const toSetExperienceReviewerParams = (
    identity: IdentityPrincipal,
    input: SetExperienceReviewerInput,
): ExecuteParams<SetExperienceReviewerRequest> => ({
    request: {
        reviewerId: input.reviewerId,
        parts: input.parts,
        capacity: input.capacity,
        conflicts: input.conflicts,
        end: input.end,
        roles: identity.roles,
    },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the answer to its GraphQL type. */
export const toSetExperienceReviewerType = (view: ReviewerView): ReviewerType => view
