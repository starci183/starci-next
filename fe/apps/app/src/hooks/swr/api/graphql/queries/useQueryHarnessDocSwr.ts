"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { readHarnessDoc } from "@/modules/harness-source"
import type { HarnessDocView } from "@/modules/types"

/** Cache identity of one article; the viewer, the article and the language are part of the key. */
export const QUERY_HARNESS_DOC_SWR_KEY = "QUERY_HARNESS_DOC_SWR"

/** Reads one article of part 3 with its markdown; the read answers undefined for an article that does not exist. */
export const useQueryHarnessDocSwr = (slug: string, locale: string): SWRResponse<HarnessDocView | undefined> => {
    const viewer = viewerKey(QUERY_HARNESS_DOC_SWR_KEY, useViewerId())
    return useSWR<HarnessDocView | undefined>(viewer === null ? null : [...viewer, slug, locale], () =>
        readHarnessDoc(slug, locale),
    )
}
