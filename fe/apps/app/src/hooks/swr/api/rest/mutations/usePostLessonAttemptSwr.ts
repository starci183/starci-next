"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing } from "@/modules/api"
import { mutateSubmitLessonAttempt } from "@/modules/api/graphql/mutations/mutation-submit-lesson-attempt"
import { attemptOf } from "@/modules/lesson-view"
import type { AttemptAnswer, AttemptView } from "@/modules/types"

/** What an attempt carries: the lesson and its version, the activity, the revision of the answer and the answer. */
type SubmitAttemptArg = {
    readonly lessonId: string
    readonly version: string
    readonly activityId: string
    readonly revision: number
    readonly locale: string
    readonly answer: AttemptAnswer
}

/** Cache identity of the attempt write. */
export const MUTATE_LESSON_ATTEMPT_SWR_KEY = "MUTATE_LESSON_ATTEMPT_SWR"

/** Saves one attempt on demand through the `submitLessonAttempt` mutation; the caller owns what the answer means. */
export const usePostLessonAttemptSwr = (): SWRMutationResponse<AttemptView, unknown, string, SubmitAttemptArg> =>
    useSWRMutation<AttemptView, unknown, string, SubmitAttemptArg>(
        MUTATE_LESSON_ATTEMPT_SWR_KEY,
        async (_key, options) => {
            const { answer, ...rest } = options.arg
            const { data } = await failing(() =>
                mutateSubmitLessonAttempt({
                    request: {
                        ...rest,
                        answer: {
                            optionId: answer.optionId ?? null,
                            text: answer.text ?? null,
                            actionIds: answer.actionIds === undefined ? null : [...answer.actionIds],
                            reachedStateId: answer.reachedStateId ?? null,
                            debrief: answer.debrief ?? null,
                            files: null,
                        },
                    },
                }),
            )
            if (data === undefined) throw new Error("attempt answered no data")
            return attemptOf(data.submitLessonAttempt)
        },
    )
