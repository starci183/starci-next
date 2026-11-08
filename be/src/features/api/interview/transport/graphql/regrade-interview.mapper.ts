import type { IdentityPrincipal } from "@modules/domain/identity"
import type { GradingView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RegradeInterviewRequest } from "../../application/regrade-interview.contracts"
import type { InterviewSessionRefInput } from "./dto/interview-session-ref.input"
import type { InterviewGradingType } from "./dto/interview-grading.type"

/** Maps the regradeInterview input and the session to the message params. */
export const toRegradeInterviewParams = (
    identity: IdentityPrincipal,
    input: InterviewSessionRefInput,
): ExecuteParams<RegradeInterviewRequest> => ({
    request: { sessionId: input.sessionId },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the result to its GraphQL type. */
export const toInterviewGradingType = (view: GradingView): InterviewGradingType => view
