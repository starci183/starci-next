"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type InterviewSessionRefInput, type SubmitInterviewMutation } from "@/modules/api"
import { mutateSubmitInterview } from "@/modules/api/graphql/mutations/mutation-submit-interview"

/** Cache identity of the submitInterview write. */
export const MUTATE_SUBMIT_INTERVIEW_SWR_KEY = "MUTATE_SUBMIT_INTERVIEW_SWR"

/** What the submitInterview write answers. */
export type SubmitInterviewResult = SubmitInterviewMutation["submitInterview"]

/** The extra argument SWR hands the fetcher. */
interface SubmitInterviewExtra {
    readonly arg: InterviewSessionRefInput
}

/** Sends the submitInterview write; a refusal rejects with the stable code of the door. */
export const useMutateSubmitInterviewSwr = (): SWRMutationResponse<
    SubmitInterviewResult,
    unknown,
    string,
    InterviewSessionRefInput
> =>
    useSWRMutation<SubmitInterviewResult, unknown, string, InterviewSessionRefInput>(
        MUTATE_SUBMIT_INTERVIEW_SWR_KEY,
        async (_key: string, { arg }: SubmitInterviewExtra) => {
            const { data } = await failing(() => mutateSubmitInterview({ request: arg }))
            if (data === undefined) throw new Error("submitInterview answered no data")
            return data.submitInterview
        },
    )
