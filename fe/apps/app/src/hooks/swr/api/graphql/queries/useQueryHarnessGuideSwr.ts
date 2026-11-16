"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { readHarnessGuide } from "@/modules/harness-source"
import type { HarnessGuideView } from "@/modules/types"

/** Cache identity of one guide; the viewer, the guide and the language are part of the key. */
export const QUERY_HARNESS_GUIDE_SWR_KEY = "QUERY_HARNESS_GUIDE_SWR"

/** Reads one guide of part 2 with its markdown; the read answers undefined for a guide that does not exist. */
export const useQueryHarnessGuideSwr = (slug: string, locale: string): SWRResponse<HarnessGuideView | undefined> => {
    const viewer = viewerKey(QUERY_HARNESS_GUIDE_SWR_KEY, useViewerId())
    return useSWR<HarnessGuideView | undefined>(viewer === null ? null : [...viewer, slug, locale], () =>
        readHarnessGuide(slug, locale),
    )
}
