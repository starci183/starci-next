"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryHarnessGuide } from "@/modules/api/graphql/queries/query-harness-guide"
import { guideOf } from "@/modules/harness-view"
import type { HarnessGuideView, HarnessTool } from "@/modules/types"

/** Cache identity of this read; the viewer and every argument are part of the key. */
export const QUERY_HARNESS_GUIDE_SWR_KEY = "QUERY_HARNESS_GUIDE_SWR_KEY"

/** How often the read is made again, so a result the CLI relays from the learner machine shows up without a reload. */
const IDLE_POLL_MS = 10_000

/** Reads one guide with its sections and the probes that check it. */
export const useQueryHarnessGuideSwr = (
    tool: HarnessTool,
    slug: string,
    locale: string,
): SWRResponse<HarnessGuideView> => {
    const viewer = viewerKey(QUERY_HARNESS_GUIDE_SWR_KEY, useViewerId())
    return useSWR<HarnessGuideView>(
        viewer === null ? null : [...viewer, tool, slug, locale],
        async () => {
            const { data } = await failing(() => queryHarnessGuide({ request: { tool, slug, locale } }))
            if (data === undefined) throw new Error("harnessGuide answered no data")
            return guideOf(data.harnessGuide)
        },
        { refreshInterval: IDLE_POLL_MS },
    )
}
