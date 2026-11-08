import type { Offer } from "@modules/domain/purchase"

/** Listing the Premium offers takes no input. */
export type ListPlansRequest = Readonly<Record<string, never>>

/** The offers the plans screen lists, in the purchase capability's own contract. */
export type ListPlansResult = ReadonlyArray<Offer>
