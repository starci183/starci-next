"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryHarnessTrials } from "@/modules/api/graphql/queries/query-harness-trials"
import { trialsOf } from "@/modules/harness-view"
import type { HarnessTool, HarnessTrialView } from "@/modules/types"

/** Cache identity of this read; the viewer and every argument are part of the key. */
export const QUERY_HARNESS_TRIALS_SWR_KEY = "QUERY_HARNESS_TRIALS_SWR_KEY"

/** How often the read is made again, so a result the CLI relays from the learner machine shows up without a reload. */
const IDLE_POLL_MS = 10_000

/** Reads the traps of one tool with the newest trial result of each. */
export const useQueryHarnessTrialsSwr = (
    tool: HarnessTool,
    locale: string,
): SWRResponse<ReadonlyArray<HarnessTrialView>> => {
    const viewer = viewerKey(QUERY_HARNESS_TRIALS_SWR_KEY, useViewerId())
    return useSWR<ReadonlyArray<HarnessTrialView>>(
        viewer === null ? null : [...viewer, tool, locale],
        async () => {
            const { data } = await failing(() => queryHarnessTrials({ request: { tool, locale } }))
            if (data === undefined) throw new Error("harnessTrials answered no data")
            return trialsOf(tool, data.harnessTrials)
        },
        { refreshInterval: IDLE_POLL_MS },
    )
}
