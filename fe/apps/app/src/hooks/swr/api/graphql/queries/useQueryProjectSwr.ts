"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type ProjectQuery, type ProjectInput } from "@/modules/api"
import { queryProject } from "@/modules/api/graphql/queries/query-project"

/** Cache identity of the project read; the viewer and the request are part of the key. */
export const QUERY_PROJECT_SWR_KEY = "QUERY_PROJECT_SWR"

/** What the project read answers. */
export type ProjectRead = ProjectQuery["project"]

/** Reads one project with its milestones, practice and proof. */
export const useQueryProjectSwr = (request: ProjectInput): SWRResponse<ProjectRead> => {
    const viewer = viewerKey(QUERY_PROJECT_SWR_KEY, useViewerId())
    const load = async (): Promise<ProjectRead> => {
        const { data } = await failing(() => queryProject({ request }))
        if (data === undefined) throw new Error("project answered no data")
        return data.project
    }
    return useSWR<ProjectRead>(viewer === null ? null : [...viewer, request.locale, request.projectId], load)
}
