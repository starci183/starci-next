import type { ExperienceItemView } from "@modules/domain/career"
import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { AssignExperienceRequest } from "../../application/assign-experience.contracts"
import type { AssignExperienceInput } from "./dto/assign-experience.input"
import type { ExperienceItemType } from "./dto/experience-item.type"

/** Maps the input and the session to the message params. */
export const toAssignExperienceParams = (
    identity: IdentityPrincipal,
    input: AssignExperienceInput,
): ExecuteParams<AssignExperienceRequest> => ({
    request: { itemId: input.itemId, reviewerId: input.reviewerId, roles: identity.roles },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the answer to its GraphQL type. */
export const toAssignExperienceType = (view: ExperienceItemView): ExperienceItemType => view
