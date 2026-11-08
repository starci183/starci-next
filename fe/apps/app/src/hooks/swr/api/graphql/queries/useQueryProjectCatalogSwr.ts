"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type ProjectCatalogQuery, type ProjectCatalogInput } from "@/modules/api"
import { queryProjectCatalog } from "@/modules/api/graphql/queries/query-project-catalog"

/** Cache identity of the projectCatalog read; the viewer and the request are part of the key. */
export const QUERY_PROJECT_CATALOG_SWR_KEY = "QUERY_PROJECT_CATALOG_SWR"

/** What the projectCatalog read answers. */
export type ProjectCatalogRead = ProjectCatalogQuery["projectCatalog"]

/** Reads the milestones, concepts and samples a project can start from. */
export const useQueryProjectCatalogSwr = (request: ProjectCatalogInput): SWRResponse<ProjectCatalogRead> => {
    const viewer = viewerKey(QUERY_PROJECT_CATALOG_SWR_KEY, useViewerId())
    const key = viewer === null ? null : [...viewer, JSON.stringify(request)]
    return useSWR<ProjectCatalogRead>(key, async () => {
        const { data } = await failing(() => queryProjectCatalog({ request }))
        if (data === undefined) throw new Error("projectCatalog answered no data")
        return data.projectCatalog
    })
}
