import type { IdentityPrincipal } from "@modules/domain/identity"
import type { AnswerView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RetryInterviewTurnRequest } from "../../application/retry-interview-turn.contracts"
import type { InterviewSessionRefInput } from "./dto/interview-session-ref.input"
import type { InterviewAnswerType } from "./dto/interview-answer.type"

/** Maps the retryInterviewTurn input and the session to the message params. */
export const toRetryInterviewTurnParams = (
    identity: IdentityPrincipal,
    input: InterviewSessionRefInput,
): ExecuteParams<RetryInterviewTurnRequest> => ({
    request: { sessionId: input.sessionId },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the result to its GraphQL type. */
export const toInterviewAnswerType = (view: AnswerView): InterviewAnswerType => view
