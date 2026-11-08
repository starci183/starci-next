import type { ExperienceItemView } from "@modules/domain/career"
import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RevokeExperienceRequest } from "../../application/revoke-experience.contracts"
import type { RevokeExperienceInput } from "./dto/revoke-experience.input"
import type { ExperienceItemType } from "./dto/experience-item.type"

/** Maps the input and the session to the message params. */
export const toRevokeExperienceParams = (
    identity: IdentityPrincipal,
    input: RevokeExperienceInput,
): ExecuteParams<RevokeExperienceRequest> => ({
    request: { itemId: input.itemId, reason: input.reason, roles: identity.roles },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the answer to its GraphQL type. */
export const toRevokeExperienceType = (view: ExperienceItemView): ExperienceItemType => view
