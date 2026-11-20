"use client"

import { useQueryViewerRolesSwr } from "@/hooks/swr"
import { useSession } from "./useSession"

/** No roles: the reader is neither teacher nor reviewer, or the roles are not read yet. */
const NO_ROLES: ReadonlyArray<string> = []

/**
 * The roles of the signed-in reader (teacher, reviewer) the Review screens use to choose what to draw; every door checks the role again.
 * The edition's access token carries no roles, so they are read from the back end (`viewerRoles`) once the session is known.
 */
export const useViewerRoles = (): ReadonlyArray<string> => {
    const { status } = useSession()
    const { data } = useQueryViewerRolesSwr(status === "signed-in")
    return data ?? NO_ROLES
}
