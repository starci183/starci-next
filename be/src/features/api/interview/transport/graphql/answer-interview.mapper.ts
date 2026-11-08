import type { IdentityPrincipal } from "@modules/domain/identity"
import type { AnswerView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { AnswerInterviewRequest } from "../../application/answer-interview.contracts"
import type { AnswerInterviewInput } from "./dto/answer-interview.input"
import type { InterviewAnswerType } from "./dto/interview-answer.type"

/** Maps the answerInterview input and the session to the message params. */
export const toAnswerInterviewParams = (
    identity: IdentityPrincipal,
    input: AnswerInterviewInput,
): ExecuteParams<AnswerInterviewRequest> => ({
    request: {
        sessionId: input.sessionId,
        position: input.position,
        revision: input.revision,
        text: input.text,
        isSkipped: input.isSkipped,
    },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the result to its GraphQL type. */
export const toInterviewAnswerType = (view: AnswerView): InterviewAnswerType => view
