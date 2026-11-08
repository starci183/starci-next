import type { IdentityPrincipal } from "@modules/domain/identity"
import type { HistoryView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetInterviewHistoryRequest } from "../../application/get-interview-history.contracts"
import type { InterviewHistoryInput } from "./dto/interview-history.input"
import type { InterviewHistoryType } from "./dto/interview-history.type"

/** Maps the interviewHistory input and the session to the message params. */
export const toGetInterviewHistoryParams = (
    identity: IdentityPrincipal,
    input: InterviewHistoryInput,
): ExecuteParams<GetInterviewHistoryRequest> => ({
    request: { track: input.track },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the result to its GraphQL type. */
export const toInterviewHistoryType = (view: HistoryView): InterviewHistoryType => view
