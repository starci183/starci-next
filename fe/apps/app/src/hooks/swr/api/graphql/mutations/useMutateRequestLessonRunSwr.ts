"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing } from "@/modules/api"
import { mutateRequestLessonRun } from "@/modules/api/graphql/mutations/mutation-request-lesson-run"

/** Cache identity of the request-lesson-run write. */
export const MUTATE_REQUEST_LESSON_RUN_SWR_KEY = "MUTATE_REQUEST_LESSON_RUN_SWR"

/** What one request takes: the lesson, the scenario and the guards to switch off for the run. */
export interface RequestLessonRunArgument {
    readonly lessonId: string
    readonly scenarioId: string
    readonly guardsOff: ReadonlyArray<string>
}

/** The machine the request went to and the command it will show its owner. */
export interface LessonRunRequested {
    readonly device: string
    readonly command: string
    readonly manifestId: string
}

/** Asks the learner's online machine to run one scenario; the result comes back over the relay and the page reads it by polling. */
export const useMutateRequestLessonRunSwr = (): SWRMutationResponse<
    LessonRunRequested,
    unknown,
    string,
    RequestLessonRunArgument
> =>
    useSWRMutation<LessonRunRequested, unknown, string, RequestLessonRunArgument>(
        MUTATE_REQUEST_LESSON_RUN_SWR_KEY,
        async (_key: string, { arg }: { readonly arg: RequestLessonRunArgument }) => {
            const { data } = await failing(() =>
                mutateRequestLessonRun({ request: { ...arg, guardsOff: [...arg.guardsOff] } }),
            )
            if (data === undefined) throw new Error("requestLessonRun answered no data")
            return data.requestLessonRun
        },
    )
