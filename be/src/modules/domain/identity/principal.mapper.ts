import type { Principal } from "@modules/platform/cqrs"
import type { IdentityPrincipal } from "./session.contracts"

/** Maps the signed-in session's verified identity to the caller every authenticated message carries. */
export const toPrincipal = (identity: IdentityPrincipal): Principal => ({ id: identity.subject, role: "authenticated" })
