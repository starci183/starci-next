"use client"

import { useSession } from "@/hooks/auth"
import { useQueryMyPremiumSwr } from "@/hooks/swr"

/** Who may use Projects: unknown while the entitlement is read, open to a Premium subscriber, locked to everyone else. */
export type ProjectsAccess = "loading" | "locked" | "open"

/**
 * The access of the signed-in reader to Projects, from the entitlement door (the one Premium read). Projects are subscription only:
 * a reader without an active term sees the pitch, never a reduced tool. The back end refuses the same doors; this only words them.
 */
export const useProjectsAccess = (): ProjectsAccess => {
    const session = useSession()
    const premium = useQueryMyPremiumSwr(session.status === "signed-in")
    if (session.status === "signed-out") return "locked"
    if (premium.data === undefined) return premium.error === undefined ? "loading" : "locked"
    return premium.data.isPremium ? "open" : "locked"
}
