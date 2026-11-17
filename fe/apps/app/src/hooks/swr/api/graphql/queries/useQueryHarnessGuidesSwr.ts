"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryHarnessGuides } from "@/modules/api/graphql/queries/query-harness-guides"
import { guideRowsOf } from "@/modules/harness-view"
import type { HarnessGuideRowView, HarnessTool } from "@/modules/types"

/** Cache identity of this read; the viewer and every argument are part of the key. */
export const QUERY_HARNESS_GUIDES_SWR_KEY = "QUERY_HARNESS_GUIDES_SWR_KEY"

/** Reads the guides of one tool. */
export const useQueryHarnessGuidesSwr = (
    tool: HarnessTool,
    locale: string,
): SWRResponse<ReadonlyArray<HarnessGuideRowView>> => {
    const viewer = viewerKey(QUERY_HARNESS_GUIDES_SWR_KEY, useViewerId())
    return useSWR<ReadonlyArray<HarnessGuideRowView>>(viewer === null ? null : [...viewer, tool, locale], async () => {
        const { data } = await failing(() => queryHarnessGuides({ request: { tool, locale } }))
        if (data === undefined) throw new Error("harnessGuides answered no data")
        return guideRowsOf(data.harnessGuides)
    })
}
