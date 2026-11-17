import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SetCvVisibilityRequest } from "../../application/set-cv-visibility.contracts"
import type { SetCvVisibilityInput } from "./dto/set-cv-visibility.input"

/** Maps the setCvVisibility input and the session to the message params. */
export const toSetCvVisibilityParams = (
    identity: IdentityPrincipal,
    input: SetCvVisibilityInput,
): ExecuteParams<SetCvVisibilityRequest> => ({
    request: { isPublic: input.isPublic, accountName: identity.displayName },
    principal: toPrincipal(identity),
})
