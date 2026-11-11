import type { EnvSource } from "@modules/platform/config"
import type { EntitlementOptions } from "./entitlement.options"

/**
 * Reads the entitlement settings an environment declares: `ENTITLEMENT_DEV_GRANT`, `true` only for the development cli, lets
 * `cli entitlement dev-grant` give a learner Premium without a purchase; every other environment leaves it undeclared.
 */
export const parseEntitlementConfig = (env: EnvSource): Required<Pick<EntitlementOptions, "devGrant">> => ({
    devGrant: env.bool("ENTITLEMENT_DEV_GRANT", false),
})
