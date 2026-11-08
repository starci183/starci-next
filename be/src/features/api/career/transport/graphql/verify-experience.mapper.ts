import type { VerificationView } from "@modules/domain/career"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { VerifyExperienceRequest } from "../../application/verify-experience.contracts"
import type { VerifyExperienceInput } from "./dto/verify-experience.input"
import type { VerificationType } from "./dto/verification.type"

/** Maps the input and the session to the message params. */
export const toVerifyExperienceParams = (
    input: VerifyExperienceInput,
): PublicExecuteParams<VerifyExperienceRequest> => ({
    request: { code: input.code },
})

/** Maps the answer to its GraphQL type. */
export const toVerifyExperienceType = (view: VerificationView): VerificationType => view
