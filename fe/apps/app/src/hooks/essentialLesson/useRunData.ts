"use client"

import { useSession } from "@/hooks/auth"
import { useQueryLessonChallengeScoresSwr, useQueryLessonScenarioRunsSwr, useQueryRelayDevicesSwr } from "@/hooks/swr"
import type { ChallengeScoreView, EssentialPart, ScenarioRunView } from "@/modules/types"
import { onlineMachineOf } from "@/modules/essential-runs"

/** No run yet: the shape the builders take while the first read runs. */
const NO_RUNS: ReadonlyArray<ScenarioRunView> = []

/** No score yet: the shape the builders take while the first read runs. */
const NO_SCORES: ReadonlyArray<ChallengeScoreView> = []

/** What the three parts that run on the machine of the learner read. */
export type RunData = {
    readonly runs: ReadonlyArray<ScenarioRunView>
    readonly scores: ReadonlyArray<ChallengeScoreView>
    /** The name of the online machine; empty when none is online. */
    readonly machine: string
    /** True while a first read still runs. */
    readonly isLoading: boolean
    /** Reads the runs again (right after a request, so the running state shows at once). */
    readonly refreshRuns: () => void
}

/**
 * Reads the newest relayed run of each scenario (again every few seconds while one is in flight), the score of each rung and the
 * online machine of the learner, for the part on screen; a locked or off-screen part reads nothing.
 */
export const useRunData = (lessonId: string, part: EssentialPart, isOpen: boolean): RunData => {
    const session = useSession()
    const isNeeded = isOpen && part !== "essence"
    const runs = useQueryLessonScenarioRunsSwr(lessonId, isNeeded)
    const scores = useQueryLessonChallengeScoresSwr(lessonId, isOpen && part === "apply")
    const devices = useQueryRelayDevicesSwr(session.status === "signed-in" && isNeeded)
    return {
        runs: runs.data ?? NO_RUNS,
        scores: scores.data ?? NO_SCORES,
        machine: onlineMachineOf(devices.data),
        isLoading: runs.isLoading || scores.isLoading || devices.isLoading,
        refreshRuns: () => void runs.mutate(),
    }
}
