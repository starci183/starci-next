"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing } from "@/modules/api"
import { mutateSaveLessonSimulation } from "@/modules/api/graphql/mutations/mutation-save-lesson-simulation"

/** Where the learner stands in a simulation, as the server kept it. */
export type SaveLessonSimulationResult = {
    readonly activityId: string
    readonly currentStateId: string
    readonly actionIds: ReadonlyArray<string>
    readonly triedTransitionIds: ReadonlyArray<string>
    readonly updatedAt: string
}

/** Cache identity of the SaveLessonSimulation write. */
export const MUTATE_SAVE_LESSON_SIMULATION_SWR_KEY = "MUTATE_SAVE_LESSON_SIMULATION_SWR"

/** The input of one SaveLessonSimulation write: the lesson at its version, the activity, the state and the path of actions to it. */
export interface SaveLessonSimulationArgument {
    readonly lessonId: string
    readonly version: string
    readonly locale: string
    readonly activityId: string
    readonly currentStateId: string
    readonly actionIds: ReadonlyArray<string>
}

/** The extra argument SWR hands the fetcher. */
interface SaveLessonSimulationExtra {
    readonly arg: SaveLessonSimulationArgument
}

/** Saves the walk of a simulation, so it survives a reload. */
export const useMutateSaveLessonSimulationSwr = (): SWRMutationResponse<
    SaveLessonSimulationResult,
    unknown,
    string,
    SaveLessonSimulationArgument
> =>
    useSWRMutation<SaveLessonSimulationResult, unknown, string, SaveLessonSimulationArgument>(
        MUTATE_SAVE_LESSON_SIMULATION_SWR_KEY,
        async (_key: string, { arg }: SaveLessonSimulationExtra) => {
            const { data } = await failing(() =>
                mutateSaveLessonSimulation({ request: { ...arg, actionIds: [...arg.actionIds] } }),
            )
            if (data === undefined) throw new Error("saveLessonSimulation answered no data")
            return data.saveLessonSimulation
        },
    )
