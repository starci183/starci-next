import type { Principal } from "@modules/platform/cqrs"
import type { IdentityPrincipal } from "./identity.contracts"

/** The caller of a guest read: the learner's principal, or undefined for a guest. */
export const toOptionalPrincipal = (identity: IdentityPrincipal | undefined): Principal | undefined =>
    identity === undefined ? undefined : toPrincipal(identity)

/** Maps the signed-in caller's verified identity to the caller every authenticated message carries. */
export const toPrincipal = (identity: IdentityPrincipal): Principal => ({ id: identity.subject, role: "authenticated" })
