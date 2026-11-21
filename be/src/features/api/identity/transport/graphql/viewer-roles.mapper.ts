import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetViewerRolesRequest } from "../../application/get-viewer-roles.contracts"

/** Maps the session to the message params of the viewerRoles door. */
export const toGetViewerRolesParams = (identity: IdentityPrincipal): ExecuteParams<GetViewerRolesRequest> => ({
    request: { roles: identity.roles },
    principal: { id: identity.subject, role: "authenticated" },
})
