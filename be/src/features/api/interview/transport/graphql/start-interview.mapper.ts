import type { IdentityPrincipal } from "@modules/domain/identity"
import type { SessionView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { StartInterviewRequest } from "../../application/start-interview.contracts"
import type { StartInterviewInput } from "./dto/start-interview.input"
import type { InterviewSessionType } from "./dto/interview-session.type"
import { toInterviewSessionType } from "./interview-session-type.mapper"

/** Maps the startInterview input and the session to the message params. */
export const toStartInterviewParams = (
    identity: IdentityPrincipal,
    input: StartInterviewInput,
): ExecuteParams<StartInterviewRequest> => ({
    request: {
        track: input.track,
        bankIds: input.bankIds,
        tier: input.tier,
        locale: input.locale,
        language: input.language,
        clientRequestId: input.clientRequestId,
    },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the result to its GraphQL type. */
export const toInterviewSessionTypeOf = (view: SessionView): InterviewSessionType => toInterviewSessionType(view)
