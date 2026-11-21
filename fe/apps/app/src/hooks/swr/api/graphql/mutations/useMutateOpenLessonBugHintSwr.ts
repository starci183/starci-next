"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing } from "@/modules/api"
import { mutateOpenLessonBugHint } from "@/modules/api/graphql/mutations/mutation-open-lesson-bug-hint"
import { bugResultOf } from "@/modules/lesson-view"
import type { BugResultView } from "@/modules/types"

/** Cache identity of the open-bug-hint write. */
export const MUTATE_OPEN_LESSON_BUG_HINT_SWR_KEY = "MUTATE_OPEN_LESSON_BUG_HINT_SWR"

/** What one open takes: the lesson, the test and the language of the hint. */
export interface OpenLessonBugHintArgument {
    readonly lessonId: string
    readonly testId: string
    readonly locale: string
}

/** Opens the next hint of a red Tìm sạn test; the back end records how many the learner opened. */
export const useMutateOpenLessonBugHintSwr = (): SWRMutationResponse<
    BugResultView,
    unknown,
    string,
    OpenLessonBugHintArgument
> =>
    useSWRMutation<BugResultView, unknown, string, OpenLessonBugHintArgument>(
        MUTATE_OPEN_LESSON_BUG_HINT_SWR_KEY,
        async (_key: string, { arg }: { readonly arg: OpenLessonBugHintArgument }) => {
            const { data } = await failing(() => mutateOpenLessonBugHint({ request: arg }))
            if (data === undefined) throw new Error("openLessonBugHint answered no data")
            return bugResultOf(data.openLessonBugHint)
        },
    )
