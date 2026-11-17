"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryHarnessDoc } from "@/modules/api/graphql/queries/query-harness-doc"
import { docOf } from "@/modules/harness-view"
import type { HarnessDocView } from "@/modules/types"

/** Cache identity of this read; the viewer and every argument are part of the key. */
export const QUERY_HARNESS_DOC_SWR_KEY = "QUERY_HARNESS_DOC_SWR_KEY"

/** Reads one article with its sections. */
export const useQueryHarnessDocSwr = (slug: string, locale: string): SWRResponse<HarnessDocView> => {
    const viewer = viewerKey(QUERY_HARNESS_DOC_SWR_KEY, useViewerId())
    return useSWR<HarnessDocView>(viewer === null ? null : [...viewer, slug, locale], async () => {
        const { data } = await failing(() => queryHarnessDoc({ request: { slug, locale } }))
        if (data === undefined) throw new Error("harnessDoc answered no data")
        return docOf(data.harnessDoc)
    })
}
