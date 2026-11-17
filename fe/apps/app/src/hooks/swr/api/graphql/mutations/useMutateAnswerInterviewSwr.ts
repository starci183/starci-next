"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type AnswerInterviewInput, type AnswerInterviewMutation } from "@/modules/api"
import { mutateAnswerInterview } from "@/modules/api/graphql/mutations/mutation-answer-interview"

/** Cache identity of the answerInterview write. */
export const MUTATE_ANSWER_INTERVIEW_SWR_KEY = "MUTATE_ANSWER_INTERVIEW_SWR"

/** What the answerInterview write answers. */
export type AnswerInterviewResult = AnswerInterviewMutation["answerInterview"]

/** The extra argument SWR hands the fetcher. */
interface AnswerInterviewExtra {
    readonly arg: AnswerInterviewInput
}

/** Sends the answerInterview write; a refusal rejects with the stable code of the door. */
export const useMutateAnswerInterviewSwr = (): SWRMutationResponse<
    AnswerInterviewResult,
    unknown,
    string,
    AnswerInterviewInput
> =>
    useSWRMutation<AnswerInterviewResult, unknown, string, AnswerInterviewInput>(
        MUTATE_ANSWER_INTERVIEW_SWR_KEY,
        async (_key: string, { arg }: AnswerInterviewExtra) => {
            const { data } = await failing(() => mutateAnswerInterview({ request: arg }))
            if (data === undefined) throw new Error("answerInterview answered no data")
            return data.answerInterview
        },
    )
