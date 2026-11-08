import type { IdentityPrincipal } from "@modules/domain/identity"
import type { GradingView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SubmitInterviewRequest } from "../../application/submit-interview.contracts"
import type { InterviewSessionRefInput } from "./dto/interview-session-ref.input"
import type { InterviewGradingType } from "./dto/interview-grading.type"

/** Maps the submitInterview input and the session to the message params. */
export const toSubmitInterviewParams = (
    identity: IdentityPrincipal,
    input: InterviewSessionRefInput,
): ExecuteParams<SubmitInterviewRequest> => ({
    request: { sessionId: input.sessionId },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the result to its GraphQL type. */
export const toInterviewGradingType = (view: GradingView): InterviewGradingType => view
