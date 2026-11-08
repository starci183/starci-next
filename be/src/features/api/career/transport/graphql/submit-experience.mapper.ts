import type { ExperienceItemView } from "@modules/domain/career"
import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SubmitExperienceRequest } from "../../application/submit-experience.contracts"
import type { SubmitExperienceInput } from "./dto/submit-experience.input"
import type { ExperienceItemType } from "./dto/experience-item.type"

/** Maps the input and the session to the message params. */
export const toSubmitExperienceParams = (
    identity: IdentityPrincipal,
    input: SubmitExperienceInput,
): ExecuteParams<SubmitExperienceRequest> => ({
    request: { itemId: input.itemId, line: { vi: input.line.vi, en: input.line.en } },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the answer to its GraphQL type. */
export const toSubmitExperienceType = (view: ExperienceItemView): ExperienceItemType => view
