import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { LearnerHubView } from "@modules/domain/hub"
import type { GetLearnerHubRequest } from "../../application/get-learner-hub.contracts"
import type { LearnerHubInput } from "./dto/learner-hub.input"
import type { LearnerHubType } from "./dto/learner-hub.type"

/** Maps the hub input and the session to the message params. */
export const toLearnerHubParams = (
    identity: IdentityPrincipal,
    input: LearnerHubInput,
): ExecuteParams<GetLearnerHubRequest> => ({
    request: { locale: input.locale },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the hub to its GraphQL type; the view is already the shape the type declares. */
export const toLearnerHubType = (view: LearnerHubView): LearnerHubType => view
