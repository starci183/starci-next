import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ClaimPracticeExperienceRequest } from "../../application/claim-practice-experience.contracts"
import type { ClaimPracticeExperienceInput } from "./dto/claim-practice-experience.input"

/** Maps the claimPracticeExperience input and the session to the message params. */
export const toClaimPracticeExperienceParams = (
    identity: IdentityPrincipal,
    input: ClaimPracticeExperienceInput,
): ExecuteParams<ClaimPracticeExperienceRequest> => ({
    request: { patternId: input.patternId },
    principal: toPrincipal(identity),
})
