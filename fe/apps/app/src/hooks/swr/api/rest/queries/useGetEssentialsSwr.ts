"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryLessons } from "@/modules/api/graphql/queries/query-lessons"
import { catalogLessonsOf } from "@/modules/lesson-view"
import type { CatalogLessonView } from "@/modules/types"

/** Cache identity of the catalog read; the viewer and the locale are part of the key. */
export const QUERY_ESSENTIALS_SWR_KEY = "QUERY_ESSENTIALS_SWR"

/** Reads the published lessons in one locale through the catalog door, wrapped in SWR so no other file calls the REST operation. */
export const useGetEssentialsSwr = (locale: string): SWRResponse<ReadonlyArray<CatalogLessonView>> => {
    const viewer = viewerKey(QUERY_ESSENTIALS_SWR_KEY, useViewerId())
    return useSWR<ReadonlyArray<CatalogLessonView>>(viewer === null ? null : [...viewer, locale], async () => {
        const { data } = await failing(() =>
            queryLessons({
                request: {
                    locale,
                    q: null,
                    category: null,
                    difficulty: null,
                    group: null,
                    language: null,
                    provider: null,
                    topic: null,
                },
            }),
        )
        if (data === undefined) throw new Error("lessons answered no data")
        return catalogLessonsOf(data)
    })
}
