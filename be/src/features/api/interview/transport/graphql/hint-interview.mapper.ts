import type { IdentityPrincipal } from "@modules/domain/identity"
import type { HintView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { HintInterviewRequest } from "../../application/hint-interview.contracts"
import type { InterviewHintInput } from "./dto/interview-hint.input"
import type { InterviewHintType } from "./dto/interview-hint.type"

/** Maps the interviewHint input and the session to the message params. */
export const toHintInterviewParams = (
    identity: IdentityPrincipal,
    input: InterviewHintInput,
): ExecuteParams<HintInterviewRequest> => ({
    request: { sessionId: input.sessionId, position: input.position },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the result to its GraphQL type. */
export const toInterviewHintType = (view: HintView): InterviewHintType => view
