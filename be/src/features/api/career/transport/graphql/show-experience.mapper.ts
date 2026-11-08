import type { ExperienceItemView } from "@modules/domain/career"
import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ShowExperienceRequest } from "../../application/show-experience.contracts"
import type { ShowExperienceInput } from "./dto/show-experience.input"
import type { ExperienceItemType } from "./dto/experience-item.type"

/** Maps the input and the session to the message params. */
export const toShowExperienceParams = (
    identity: IdentityPrincipal,
    input: ShowExperienceInput,
): ExecuteParams<ShowExperienceRequest> => ({
    request: { itemId: input.itemId, shownPublicly: input.shownPublicly },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the answer to its GraphQL type. */
export const toShowExperienceType = (view: ExperienceItemView): ExperienceItemType => view
