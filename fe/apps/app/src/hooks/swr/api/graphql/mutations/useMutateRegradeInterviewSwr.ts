"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type InterviewSessionRefInput, type RegradeInterviewMutation } from "@/modules/api"
import { mutateRegradeInterview } from "@/modules/api/graphql/mutations/mutation-regrade-interview"

/** Cache identity of the regradeInterview write. */
export const MUTATE_REGRADE_INTERVIEW_SWR_KEY = "MUTATE_REGRADE_INTERVIEW_SWR"

/** What the regradeInterview write answers. */
export type RegradeInterviewResult = RegradeInterviewMutation["regradeInterview"]

/** The extra argument SWR hands the fetcher. */
interface RegradeInterviewExtra {
    readonly arg: InterviewSessionRefInput
}

/** Sends the regradeInterview write; a refusal rejects with the stable code of the door. */
export const useMutateRegradeInterviewSwr = (): SWRMutationResponse<
    RegradeInterviewResult,
    unknown,
    string,
    InterviewSessionRefInput
> =>
    useSWRMutation<RegradeInterviewResult, unknown, string, InterviewSessionRefInput>(
        MUTATE_REGRADE_INTERVIEW_SWR_KEY,
        async (_key: string, { arg }: RegradeInterviewExtra) => {
            const { data } = await failing(() => mutateRegradeInterview({ request: arg }))
            if (data === undefined) throw new Error("regradeInterview answered no data")
            return data.regradeInterview
        },
    )
