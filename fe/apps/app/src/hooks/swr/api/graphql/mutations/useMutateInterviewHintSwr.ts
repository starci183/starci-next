"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type InterviewHintInput, type InterviewHintMutation } from "@/modules/api"
import { mutateInterviewHint } from "@/modules/api/graphql/mutations/mutation-interview-hint"

/** Cache identity of the interviewHint write. */
export const MUTATE_INTERVIEW_HINT_SWR_KEY = "MUTATE_INTERVIEW_HINT_SWR"

/** What the interviewHint write answers. */
export type InterviewHintResult = InterviewHintMutation["interviewHint"]

/** The extra argument SWR hands the fetcher. */
interface InterviewHintExtra {
    readonly arg: InterviewHintInput
}

/** Sends the interviewHint write; a refusal rejects with the stable code of the door. */
export const useMutateInterviewHintSwr = (): SWRMutationResponse<
    InterviewHintResult,
    unknown,
    string,
    InterviewHintInput
> =>
    useSWRMutation<InterviewHintResult, unknown, string, InterviewHintInput>(
        MUTATE_INTERVIEW_HINT_SWR_KEY,
        async (_key: string, { arg }: InterviewHintExtra) => {
            const { data } = await failing(() => mutateInterviewHint({ request: arg }))
            if (data === undefined) throw new Error("interviewHint answered no data")
            return data.interviewHint
        },
    )
