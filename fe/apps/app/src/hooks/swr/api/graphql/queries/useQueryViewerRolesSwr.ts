"use client"

import useSWR, { type SWRResponse } from "swr"
import { failing } from "@/modules/api"
import { queryViewerRoles } from "@/modules/api/graphql/queries/query-viewer-roles"

/** Cache identity of the roles read; the SWR cache is already scoped to the viewer on screen. */
export const QUERY_VIEWER_ROLES_SWR_KEY = "QUERY_VIEWER_ROLES_SWR"

/** Reads the data of the viewerRoles door; a failure stays the read's error. */
const loadViewerRoles = async (): Promise<ReadonlyArray<string>> => {
    const { data } = await failing(() => queryViewerRoles())
    if (data === undefined) throw new Error("viewerRoles answered no data")
    return data.viewerRoles
}

/** Reads the roles of the signed-in reader; `isEnabled` is false while there is no session, since the door needs one. */
export const useQueryViewerRolesSwr = (isEnabled: boolean): SWRResponse<ReadonlyArray<string>> =>
    useSWR<ReadonlyArray<string>>(isEnabled ? QUERY_VIEWER_ROLES_SWR_KEY : null, loadViewerRoles)
