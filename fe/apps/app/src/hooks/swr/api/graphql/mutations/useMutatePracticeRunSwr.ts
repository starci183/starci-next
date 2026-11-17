"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing } from "@/modules/api"
import { mutateRunPractice } from "@/modules/api/graphql/mutations/mutation-run-practice"
import { practiceSubmissionOf } from "@/modules/practice-view"
import type { PracticeLanguageId, PracticeSubmissionView } from "@/modules/types"

/** Cache identity of the run write. */
export const MUTATE_PRACTICE_RUN_SWR_KEY = "MUTATE_PRACTICE_RUN_SWR"

/** What one run or submission takes: the problem, the language and the learner's source. */
export interface PracticeCodeArgument {
    readonly slug: string
    readonly language: PracticeLanguageId
    readonly source: string
}

/** The extra argument SWR hands the run fetcher. */
interface PracticeRunExtra {
    readonly arg: PracticeCodeArgument
}

/** Queues a run on the example test only; the trigger rejects with the typed failure and answers the submission. */
export const useMutatePracticeRunSwr = (): SWRMutationResponse<
    PracticeSubmissionView,
    unknown,
    string,
    PracticeCodeArgument
> =>
    useSWRMutation<PracticeSubmissionView, unknown, string, PracticeCodeArgument>(
        MUTATE_PRACTICE_RUN_SWR_KEY,
        async (_key: string, { arg }: PracticeRunExtra) => {
            const { data } = await failing(() => mutateRunPractice({ request: arg }))
            if (data === undefined) throw new Error("runPractice answered no data")
            return practiceSubmissionOf(data.runPractice)
        },
    )
