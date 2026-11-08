"use client"

import { useSession } from "@/hooks/auth"
import { useQueryMyPremiumSwr } from "@/hooks/swr"

/** The plan the header names: not known yet (signed out, or the entitlement read has not answered), Premium, or Free. */
export type ViewerPlan = "unknown" | "premium" | "free"

/** The plan of the signed-in reader from the entitlement door (the same read the plans screen uses). */
export const useViewerPlan = (): ViewerPlan => {
    const session = useSession()
    const premium = useQueryMyPremiumSwr(session.status === "signed-in").data
    if (premium === undefined) return "unknown"
    return premium.isPremium ? "premium" : "free"
}
