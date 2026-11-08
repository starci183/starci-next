import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetPracticeSubmissionRequest } from "../../application/get-practice-submission.contracts"
import type { PracticeSubmissionInput } from "./dto/practice-submission.input"

/** Maps the one submission of the caller input and the session to the message params. */
export const toGetPracticeSubmissionParams = (
    identity: IdentityPrincipal,
    input: PracticeSubmissionInput,
): ExecuteParams<GetPracticeSubmissionRequest> => ({
    request: { submissionId: input.submissionId },
    principal: toPrincipal(identity),
})
