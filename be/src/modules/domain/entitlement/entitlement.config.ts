import type { EnvSource } from "@modules/platform/config"
import { DEFAULT_ESSENTIAL_FREE_PARTS, ESSENTIAL_PARTS, type EssentialPart } from "./entitlement.contracts"
import type { EntitlementOptions } from "./entitlement.options"

/** The value that declares no free part at all: every part of every Essentials lesson needs Premium. */
const NO_FREE_PARTS = "none"

/** The parts of a comma-separated list; an id that is not one of the four parts is a boot failure. */
const essentialPartsOf = (raw: string): ReadonlyArray<EssentialPart> => {
    if (raw.trim().toLowerCase() === NO_FREE_PARTS) return []
    return raw
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id !== "")
        .map((id) => {
            const part = ESSENTIAL_PARTS.find((each) => each === id)
            if (part === undefined)
                throw new Error(
                    `ENTITLEMENT_ESSENTIAL_FREE_PARTS names ${id}; use ${ESSENTIAL_PARTS.join(", ")} or ${NO_FREE_PARTS}`,
                )
            return part
        })
}

/**
 * Reads the entitlement settings an environment declares: `ENTITLEMENT_DEV_GRANT`, `true` only for the development cli, lets
 * `cli entitlement dev-grant` give a learner Premium without a purchase; every other environment leaves it undeclared.
 * `ENTITLEMENT_ESSENTIAL_FREE_PARTS`, a comma-separated list of `1-essential`, `2-source`, `3-scenarios`, `4-apply` or `none`,
 * names the parts of an Essentials lesson open without Premium; undeclared, only `1-essential` (the opener and the article).
 */
export const parseEntitlementConfig = (
    env: EnvSource,
): Required<Pick<EntitlementOptions, "devGrant" | "essentialFreeParts">> => ({
    devGrant: env.bool("ENTITLEMENT_DEV_GRANT", false),
    essentialFreeParts:
        env.optional("ENTITLEMENT_ESSENTIAL_FREE_PARTS") === undefined
            ? DEFAULT_ESSENTIAL_FREE_PARTS
            : essentialPartsOf(env.optional("ENTITLEMENT_ESSENTIAL_FREE_PARTS") ?? ""),
})
