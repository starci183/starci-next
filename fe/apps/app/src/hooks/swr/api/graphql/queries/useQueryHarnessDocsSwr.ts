"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryHarnessDocs } from "@/modules/api/graphql/queries/query-harness-docs"
import { docRowsOf } from "@/modules/harness-view"
import type { HarnessDocRowView } from "@/modules/types"

/** Cache identity of this read; the viewer and every argument are part of the key. */
export const QUERY_HARNESS_DOCS_SWR_KEY = "QUERY_HARNESS_DOCS_SWR_KEY"

/** Reads the articles of part 3. */
export const useQueryHarnessDocsSwr = (locale: string): SWRResponse<ReadonlyArray<HarnessDocRowView>> => {
    const viewer = viewerKey(QUERY_HARNESS_DOCS_SWR_KEY, useViewerId())
    return useSWR<ReadonlyArray<HarnessDocRowView>>(viewer === null ? null : [...viewer, locale], async () => {
        const { data } = await failing(() => queryHarnessDocs({ request: { locale } }))
        if (data === undefined) throw new Error("harnessDocs answered no data")
        return docRowsOf(data.harnessDocs)
    })
}
