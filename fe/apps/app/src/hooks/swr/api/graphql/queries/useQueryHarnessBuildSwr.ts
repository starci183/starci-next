"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryHarnessBuild } from "@/modules/api/graphql/queries/query-harness-build"
import { buildOf } from "@/modules/harness-view"
import type { HarnessBuildView } from "@/modules/types"

/** Cache identity of this read; the viewer and every argument are part of the key. */
export const QUERY_HARNESS_BUILD_SWR_KEY = "QUERY_HARNESS_BUILD_SWR_KEY"

/** How often the build is read again while a stage is running: the stage list follows the learner machine live. */
const RUNNING_POLL_MS = 2000

/** How often a read is made again otherwise, so an e2e run from the terminal shows up without a reload. */
const IDLE_POLL_MS = 10_000

/** Reads one build with the newest e2e result of each stage. */
export const useQueryHarnessBuildSwr = (buildId: string, locale: string): SWRResponse<HarnessBuildView> => {
    const viewer = viewerKey(QUERY_HARNESS_BUILD_SWR_KEY, useViewerId())
    return useSWR<HarnessBuildView>(
        viewer === null ? null : [...viewer, buildId, locale],
        async () => {
            const { data } = await failing(() => queryHarnessBuild({ request: { id: buildId, locale } }))
            if (data === undefined) throw new Error("harnessBuild answered no data")
            return buildOf(data.harnessBuild)
        },
        {
            refreshInterval: (build) =>
                (build?.stages ?? []).some((stage) => stage.outcome === "running") ? RUNNING_POLL_MS : IDLE_POLL_MS,
        },
    )
}
