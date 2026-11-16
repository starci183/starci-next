"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryLessonScenarioRuns } from "@/modules/api/graphql/queries/query-lesson-scenario-runs"
import { scenarioRunsOf } from "@/modules/lesson-view"
import type { ScenarioRunView } from "@/modules/types"

/** Cache identity of the scenario runs; the viewer and the lesson are part of the key. */
export const QUERY_LESSON_SCENARIO_RUNS_SWR_KEY = "QUERY_LESSON_SCENARIO_RUNS_SWR"

/** How often the runs are read again while one is in flight: the relay panel follows the CLI live. */
const RUNNING_POLL_MS = 2000

/** How often the runs are read again otherwise, so a run started from the terminal shows up without a reload. */
const IDLE_POLL_MS = 10_000

/**
 * Reads the newest relayed run of each scenario of a lesson (practice from the learner's own machine). `isEnabled` is false
 * while the parts that show runs are locked or off screen.
 */
export const useQueryLessonScenarioRunsSwr = (
    lessonId: string,
    isEnabled: boolean,
): SWRResponse<ReadonlyArray<ScenarioRunView>> => {
    const viewer = viewerKey(QUERY_LESSON_SCENARIO_RUNS_SWR_KEY, useViewerId())
    return useSWR<ReadonlyArray<ScenarioRunView>>(
        viewer === null || !isEnabled ? null : [...viewer, lessonId],
        async () => {
            const { data } = await failing(() => queryLessonScenarioRuns({ request: { lessonId } }))
            if (data === undefined) throw new Error("lessonScenarioRuns answered no data")
            return scenarioRunsOf(data)
        },
        {
            refreshInterval: (runs) =>
                (runs ?? []).some((run) => run.status === "running") ? RUNNING_POLL_MS : IDLE_POLL_MS,
        },
    )
}
