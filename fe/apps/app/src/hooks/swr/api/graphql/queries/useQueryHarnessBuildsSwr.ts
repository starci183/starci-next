"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryHarnessBuilds } from "@/modules/api/graphql/queries/query-harness-builds"
import { buildRowsOf } from "@/modules/harness-view"
import type { HarnessBuildRowView } from "@/modules/types"

/** Cache identity of this read; the viewer and every argument are part of the key. */
export const QUERY_HARNESS_BUILDS_SWR_KEY = "QUERY_HARNESS_BUILDS_SWR_KEY"

/** How often the read is made again, so a result the CLI relays from the learner machine shows up without a reload. */
const IDLE_POLL_MS = 10_000

/** Reads the builds of part 1 with their progress. */
export const useQueryHarnessBuildsSwr = (locale: string): SWRResponse<ReadonlyArray<HarnessBuildRowView>> => {
    const viewer = viewerKey(QUERY_HARNESS_BUILDS_SWR_KEY, useViewerId())
    return useSWR<ReadonlyArray<HarnessBuildRowView>>(
        viewer === null ? null : [...viewer, locale],
        async () => {
            const { data } = await failing(() => queryHarnessBuilds({ request: { locale } }))
            if (data === undefined) throw new Error("harnessBuilds answered no data")
            return buildRowsOf(data.harnessBuilds)
        },
        { refreshInterval: IDLE_POLL_MS },
    )
}
