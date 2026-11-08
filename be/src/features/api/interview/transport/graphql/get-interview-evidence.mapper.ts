import type { IdentityPrincipal } from "@modules/domain/identity"
import type { EvidenceItem } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetInterviewEvidenceRequest } from "../../application/get-interview-evidence.contracts"
import type { InterviewEvidenceType } from "./dto/interview-evidence.type"

/** Maps the interviewEvidence input and the session to the message params. */
export const toGetInterviewEvidenceParams = (
    identity: IdentityPrincipal,
): ExecuteParams<GetInterviewEvidenceRequest> => ({
    request: {},
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the result to its GraphQL type. */
export const toInterviewEvidenceType = (view: ReadonlyArray<EvidenceItem>): ReadonlyArray<InterviewEvidenceType> => view
