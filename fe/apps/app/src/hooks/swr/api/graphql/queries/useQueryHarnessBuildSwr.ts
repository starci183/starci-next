"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { readHarnessBuild } from "@/modules/harness-source"
import type { HarnessBuildView } from "@/modules/types"

/** Cache identity of one build; the viewer, the build and the language are part of the key. */
export const QUERY_HARNESS_BUILD_SWR_KEY = "QUERY_HARNESS_BUILD_SWR"

/** How often the build is read again while a stage is running: the stage list follows the learner's machine live. */
const RUNNING_POLL_MS = 2000

/** How often the build is read again otherwise, so an e2e run from the terminal shows up without a reload. */
const IDLE_POLL_MS = 10_000

/** Reads one build with the newest e2e result of each stage; the read answers undefined for a build that does not exist. */
export const useQueryHarnessBuildSwr = (buildId: string, locale: string): SWRResponse<HarnessBuildView | undefined> => {
    const viewer = viewerKey(QUERY_HARNESS_BUILD_SWR_KEY, useViewerId())
    return useSWR<HarnessBuildView | undefined>(
        viewer === null ? null : [...viewer, buildId, locale],
        () => readHarnessBuild(buildId, locale),
        {
            refreshInterval: (build) =>
                (build?.stages ?? []).some((stage) => stage.outcome === "running") ? RUNNING_POLL_MS : IDLE_POLL_MS,
        },
    )
}
