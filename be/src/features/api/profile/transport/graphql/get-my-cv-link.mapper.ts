import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetMyCvLinkRequest } from "../../application/get-my-cv-link.contracts"

/** Maps the session to the message params of the CV link read. */
export const toGetMyCvLinkParams = (identity: IdentityPrincipal): ExecuteParams<GetMyCvLinkRequest> => ({
    request: { accountName: identity.displayName },
    principal: toPrincipal(identity),
})
