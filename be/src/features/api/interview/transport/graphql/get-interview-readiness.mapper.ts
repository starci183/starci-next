import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ReadinessView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetInterviewReadinessRequest } from "../../application/get-interview-readiness.contracts"
import type { InterviewReadinessInput } from "./dto/interview-readiness.input"
import type { InterviewReadinessType } from "./dto/interview-readiness.type"

/** Maps the interviewReadiness input and the session to the message params. */
export const toGetInterviewReadinessParams = (
    identity: IdentityPrincipal,
    input: InterviewReadinessInput,
): ExecuteParams<GetInterviewReadinessRequest> => ({
    request: { track: input.track, tier: input.tier },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the result to its GraphQL type. */
export const toInterviewReadinessType = (view: ReadinessView): InterviewReadinessType => view
