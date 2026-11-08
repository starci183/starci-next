"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type AbandonInterviewMutation, type InterviewSessionRefInput } from "@/modules/api"
import { mutateAbandonInterview } from "@/modules/api/graphql/mutations/mutation-abandon-interview"

/** Cache identity of the abandonInterview write. */
export const MUTATE_ABANDON_INTERVIEW_SWR_KEY = "MUTATE_ABANDON_INTERVIEW_SWR"

/** What the abandonInterview write answers. */
export type AbandonInterviewResult = AbandonInterviewMutation["abandonInterview"]

/** The extra argument SWR hands the fetcher. */
interface AbandonInterviewExtra {
    readonly arg: InterviewSessionRefInput
}

/** Sends the abandonInterview write; a refusal rejects with the stable code of the door. */
export const useMutateAbandonInterviewSwr = (): SWRMutationResponse<
    AbandonInterviewResult,
    unknown,
    string,
    InterviewSessionRefInput
> =>
    useSWRMutation<AbandonInterviewResult, unknown, string, InterviewSessionRefInput>(
        MUTATE_ABANDON_INTERVIEW_SWR_KEY,
        async (_key: string, { arg }: AbandonInterviewExtra) => {
            const { data } = await failing(() => mutateAbandonInterview({ request: arg }))
            if (data === undefined) throw new Error("abandonInterview answered no data")
            return data.abandonInterview
        },
    )
