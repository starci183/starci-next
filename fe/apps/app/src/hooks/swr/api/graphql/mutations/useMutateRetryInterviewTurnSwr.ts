"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type InterviewSessionRefInput, type RetryInterviewTurnMutation } from "@/modules/api"
import { mutateRetryInterviewTurn } from "@/modules/api/graphql/mutations/mutation-retry-interview-turn"

/** Cache identity of the retryInterviewTurn write. */
export const MUTATE_RETRY_INTERVIEW_TURN_SWR_KEY = "MUTATE_RETRY_INTERVIEW_TURN_SWR"

/** What the retryInterviewTurn write answers. */
export type RetryInterviewTurnResult = RetryInterviewTurnMutation["retryInterviewTurn"]

/** The extra argument SWR hands the fetcher. */
interface RetryInterviewTurnExtra {
    readonly arg: InterviewSessionRefInput
}

/** Sends the retryInterviewTurn write; a refusal rejects with the stable code of the door. */
export const useMutateRetryInterviewTurnSwr = (): SWRMutationResponse<
    RetryInterviewTurnResult,
    unknown,
    string,
    InterviewSessionRefInput
> =>
    useSWRMutation<RetryInterviewTurnResult, unknown, string, InterviewSessionRefInput>(
        MUTATE_RETRY_INTERVIEW_TURN_SWR_KEY,
        async (_key: string, { arg }: RetryInterviewTurnExtra) => {
            const { data } = await failing(() => mutateRetryInterviewTurn({ request: arg }))
            if (data === undefined) throw new Error("retryInterviewTurn answered no data")
            return data.retryInterviewTurn
        },
    )
