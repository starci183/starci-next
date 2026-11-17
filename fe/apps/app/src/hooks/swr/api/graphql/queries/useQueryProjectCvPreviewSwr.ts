"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type ProjectCvPreviewInput, type ProjectCvPreviewQuery } from "@/modules/api"
import { queryProjectCvPreview } from "@/modules/api/graphql/queries/query-project-cv-preview"

/** Cache identity of the projectCvPreview read; the viewer and the request are part of the key. */
export const QUERY_PROJECT_CV_PREVIEW_SWR_KEY = "QUERY_PROJECT_CV_PREVIEW_SWR"

/** What the projectCvPreview read answers. */
export type ProjectCvPreviewRead = ProjectCvPreviewQuery["projectCvPreview"]

/** Reads the CV line one concept of a project gives once proved. */
export const useQueryProjectCvPreviewSwr = (request: ProjectCvPreviewInput): SWRResponse<ProjectCvPreviewRead> => {
    const viewer = viewerKey(QUERY_PROJECT_CV_PREVIEW_SWR_KEY, useViewerId())
    const key = viewer === null ? null : [...viewer, request.locale, request.projectId, request.conceptId ?? ""]
    return useSWR<ProjectCvPreviewRead>(key, async () => {
        const { data } = await failing(() => queryProjectCvPreview({ request }))
        if (data === undefined) throw new Error("projectCvPreview answered no data")
        return data.projectCvPreview
    })
}
