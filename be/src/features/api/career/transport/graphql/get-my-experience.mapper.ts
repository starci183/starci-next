import type { MyExperienceView } from "@modules/domain/career"
import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetMyExperienceRequest } from "../../application/get-my-experience.contracts"
import type { MyExperienceInput } from "./dto/my-experience.input"
import type { MyExperienceType } from "./dto/my-experience.type"

/** Maps the input and the session to the message params. */
export const toGetMyExperienceParams = (
    identity: IdentityPrincipal,
    input: MyExperienceInput,
): ExecuteParams<GetMyExperienceRequest> => ({
    request: { state: input.state },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the answer to its GraphQL type. */
export const toGetMyExperienceType = (view: MyExperienceView): MyExperienceType => view
