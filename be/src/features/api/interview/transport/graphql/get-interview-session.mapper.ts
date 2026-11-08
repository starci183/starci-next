import type { IdentityPrincipal } from "@modules/domain/identity"
import type { SessionView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetInterviewSessionRequest } from "../../application/get-interview-session.contracts"
import type { InterviewSessionRefInput } from "./dto/interview-session-ref.input"
import type { InterviewSessionType } from "./dto/interview-session.type"
import { toInterviewSessionType } from "./interview-session-type.mapper"

/** Maps the interviewSession input and the session to the message params. */
export const toGetInterviewSessionParams = (
    identity: IdentityPrincipal,
    input: InterviewSessionRefInput,
): ExecuteParams<GetInterviewSessionRequest> => ({
    request: { sessionId: input.sessionId },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the result to its GraphQL type. */
export const toInterviewSessionTypeOf = (view: SessionView): InterviewSessionType => toInterviewSessionType(view)
