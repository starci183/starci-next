"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type ProjectCodeReadQuery, type ProjectConceptInput } from "@/modules/api"
import { queryProjectCodeRead } from "@/modules/api/graphql/queries/query-project-code-read"

/** Cache identity of the projectCodeRead read; the viewer and the request are part of the key. */
export const QUERY_PROJECT_CODE_READ_SWR_KEY = "QUERY_PROJECT_CODE_READ_SWR"

/** What the projectCodeRead read answers: the latest read with its rubric, or null when none was made. */
export type ProjectCodeReadRead = ProjectCodeReadQuery["projectCodeRead"]

/** Reads the latest AI code read of one concept of a project. */
export const useQueryProjectCodeReadSwr = (request: ProjectConceptInput): SWRResponse<ProjectCodeReadRead> => {
    const viewer = viewerKey(QUERY_PROJECT_CODE_READ_SWR_KEY, useViewerId())
    const key = viewer === null ? null : [...viewer, request.locale, request.projectId, request.conceptId]
    return useSWR<ProjectCodeReadRead>(key, async () => {
        const { data } = await failing(() => queryProjectCodeRead({ request }))
        if (data === undefined) throw new Error("projectCodeRead answered no data")
        return data.projectCodeRead
    })
}
