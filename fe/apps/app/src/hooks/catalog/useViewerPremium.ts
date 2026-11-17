"use client"

import { useSession } from "@/hooks/auth"
import { useQueryMyPremiumSwr } from "@/hooks/swr"

/**
 * True when the signed-in reader holds an active Premium term, as the entitlement door (the same read the plans screen uses) says;
 * the back end gates a lesson by that entitlement, so the words follow it. The catalog itself is never locked: this only words the
 * status and the upsell.
 */
export const useViewerPremium = (): boolean => {
    const session = useSession()
    return useQueryMyPremiumSwr(session.status === "signed-in").data?.isPremium === true
}
