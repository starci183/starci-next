import type { IdentityPrincipal } from "@modules/domain/identity"
import type { LearnerProgressView } from "@modules/domain/progress"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetLearnerProgressRequest } from "../../application/get-learner-progress.contracts"
import type { LearnerProgressInput } from "./dto/learner-progress.input"
import type { LearnerProgressType } from "./dto/learner-progress.type"

/** Maps the progress input and the session to the message params. */
export const toLearnerProgressParams = (
    identity: IdentityPrincipal,
    input: LearnerProgressInput,
): ExecuteParams<GetLearnerProgressRequest> => ({
    request: { locale: input.locale },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the progress to its GraphQL type; the view is already the shape the type declares. */
export const toLearnerProgressType = (view: LearnerProgressView): LearnerProgressType => view
