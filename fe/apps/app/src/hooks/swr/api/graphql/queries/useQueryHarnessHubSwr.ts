"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryHarnessHub } from "@/modules/api/graphql/queries/query-harness-hub"
import { hubPartsOf } from "@/modules/harness-view"
import type { HarnessHubPartView } from "@/modules/types"

/** Cache identity of this read; the viewer and every argument are part of the key. */
export const QUERY_HARNESS_HUB_SWR_KEY = "QUERY_HARNESS_HUB_SWR_KEY"

/** How often the read is made again, so a result the CLI relays from the learner machine shows up without a reload. */
const IDLE_POLL_MS = 10_000

/** Reads the three parts of the harness hub with the learner counts. */
export const useQueryHarnessHubSwr = (locale: string): SWRResponse<ReadonlyArray<HarnessHubPartView>> => {
    const viewer = viewerKey(QUERY_HARNESS_HUB_SWR_KEY, useViewerId())
    return useSWR<ReadonlyArray<HarnessHubPartView>>(
        viewer === null ? null : [...viewer, locale],
        async () => {
            const { data } = await failing(() => queryHarnessHub({ request: { locale } }))
            if (data === undefined) throw new Error("harnessHub answered no data")
            return hubPartsOf(data.harnessHub)
        },
        { refreshInterval: IDLE_POLL_MS },
    )
}
