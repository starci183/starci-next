"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type ProjectsQuery, type ProjectsInput } from "@/modules/api"
import { queryProjects } from "@/modules/api/graphql/queries/query-projects"

/** Cache identity of the projects read; the viewer and the request are part of the key. */
export const QUERY_PROJECTS_SWR_KEY = "QUERY_PROJECTS_SWR"

/** What the projects read answers. */
export type ProjectsRead = ProjectsQuery["projects"]

/** Lists the signed-in learner's projects with their progress. */
export const useQueryProjectsSwr = (request: ProjectsInput): SWRResponse<ProjectsRead> => {
    const viewer = viewerKey(QUERY_PROJECTS_SWR_KEY, useViewerId())
    return useSWR<ProjectsRead>(viewer === null ? null : [...viewer, JSON.stringify(request)], async () => {
        const { data } = await failing(() => queryProjects({ request }))
        if (data === undefined) throw new Error("projects answered no data")
        return data.projects
    })
}
