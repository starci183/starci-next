import type { IdentityPrincipal } from "@modules/domain/identity"
import type { InterviewOptionsView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetInterviewOptionsRequest } from "../../application/get-interview-options.contracts"
import type { InterviewOptionsInput } from "./dto/interview-options.input"
import type { InterviewOptionsType } from "./dto/interview-options.type"

/** Maps the interviewOptions input and the session to the message params. */
export const toGetInterviewOptionsParams = (
    identity: IdentityPrincipal,
    input: InterviewOptionsInput,
): ExecuteParams<GetInterviewOptionsRequest> => ({
    request: { locale: input.locale, track: input.track },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the result to its GraphQL type. */
export const toInterviewOptionsType = (view: InterviewOptionsView): InterviewOptionsType => view
