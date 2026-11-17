"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type ProjectMilestoneQuery, type ProjectMilestoneInput } from "@/modules/api"
import { queryProjectMilestone } from "@/modules/api/graphql/queries/query-project-milestone"

/** Cache identity of the projectMilestone read; the viewer and the request are part of the key. */
export const QUERY_PROJECT_MILESTONE_SWR_KEY = "QUERY_PROJECT_MILESTONE_SWR"

/** What the projectMilestone read answers. */
export type ProjectMilestoneRead = ProjectMilestoneQuery["projectMilestone"]

/** Reads the concept checklist of one milestone of a project. */
export const useQueryProjectMilestoneSwr = (request: ProjectMilestoneInput): SWRResponse<ProjectMilestoneRead> => {
    const viewer = viewerKey(QUERY_PROJECT_MILESTONE_SWR_KEY, useViewerId())
    const key = viewer === null ? null : [...viewer, request.locale, request.projectId, request.milestoneId]
    return useSWR<ProjectMilestoneRead>(key, async () => {
        const { data } = await failing(() => queryProjectMilestone({ request }))
        if (data === undefined) throw new Error("projectMilestone answered no data")
        return data.projectMilestone
    })
}
