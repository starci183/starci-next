import { DEFAULT_ESSENTIAL_FREE_PARTS, ESSENTIAL_PARTS, type EssentialPart } from "./entitlement.contracts"
import type { EntitlementOptions } from "./entitlement.options"

/** The parts of an Essentials lesson that need no Premium: the app's setting over the default (Bản chất only). */
export const essentialFreePartsOf = (
    options: Pick<EntitlementOptions, "essentialFreeParts">,
): ReadonlyArray<EssentialPart> => options.essentialFreeParts ?? DEFAULT_ESSENTIAL_FREE_PARTS

/** The parts a learner may read: every part with Premium, the free parts without. */
export const openEssentialPartsOf = (
    free: ReadonlyArray<EssentialPart>,
    isPremium: boolean,
): ReadonlyArray<EssentialPart> => (isPremium ? ESSENTIAL_PARTS : ESSENTIAL_PARTS.filter((part) => free.includes(part)))

/** The parts of the list a learner may not read: what the view marks locked and what a door refuses. */
export const lockedEssentialPartsOf = (open: ReadonlyArray<EssentialPart>): ReadonlyArray<EssentialPart> =>
    ESSENTIAL_PARTS.filter((part) => !open.includes(part))
