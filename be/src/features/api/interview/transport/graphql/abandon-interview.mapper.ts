import type { IdentityPrincipal } from "@modules/domain/identity"
import type { AbandonView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { AbandonInterviewRequest } from "../../application/abandon-interview.contracts"
import type { InterviewSessionRefInput } from "./dto/interview-session-ref.input"
import type { InterviewAbandonType } from "./dto/interview-abandon.type"

/** Maps the abandonInterview input and the session to the message params. */
export const toAbandonInterviewParams = (
    identity: IdentityPrincipal,
    input: InterviewSessionRefInput,
): ExecuteParams<AbandonInterviewRequest> => ({
    request: { sessionId: input.sessionId },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the result to its GraphQL type. */
export const toInterviewAbandonType = (view: AbandonView): InterviewAbandonType => view
