import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GradeReviewCardRequest } from "../../application/grade-review-card.contracts"
import type { GradeRecallCardInput } from "./dto/grade-recall-card.input"

/** Maps the gradeReviewCard input and the session to the message params. */
export const toGradeReviewCardParams = (
    identity: IdentityPrincipal,
    input: GradeRecallCardInput,
): ExecuteParams<GradeReviewCardRequest> => ({
    request: { itemId: input.itemId, revision: input.revision, grade: input.grade, clozeCorrect: input.clozeCorrect },
    principal: { id: identity.subject, role: "authenticated" },
})
