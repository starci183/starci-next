"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing } from "@/modules/api"
import { mutateSubmitPractice } from "@/modules/api/graphql/mutations/mutation-submit-practice"
import { practiceSubmissionOf } from "@/modules/practice-view"
import type { PracticeSubmissionView } from "@/modules/types"
import type { PracticeCodeArgument } from "./useMutatePracticeRunSwr"

/** Cache identity of the submit write. */
export const MUTATE_PRACTICE_SUBMIT_SWR_KEY = "MUTATE_PRACTICE_SUBMIT_SWR"

/** The extra argument SWR hands the submit fetcher. */
interface PracticeSubmitExtra {
    readonly arg: PracticeCodeArgument
}

/** Queues a submission against every test; each call counts toward the learner's rate limit. */
export const useMutatePracticeSubmitSwr = (): SWRMutationResponse<
    PracticeSubmissionView,
    unknown,
    string,
    PracticeCodeArgument
> =>
    useSWRMutation<PracticeSubmissionView, unknown, string, PracticeCodeArgument>(
        MUTATE_PRACTICE_SUBMIT_SWR_KEY,
        async (_key: string, { arg }: PracticeSubmitExtra) => {
            const { data } = await failing(() => mutateSubmitPractice({ request: arg }))
            if (data === undefined) throw new Error("submitPractice answered no data")
            return practiceSubmissionOf(data.submitPractice)
        },
    )
