"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type StartInterviewInput, type StartInterviewMutation } from "@/modules/api"
import { mutateStartInterview } from "@/modules/api/graphql/mutations/mutation-start-interview"

/** Cache identity of the startInterview write. */
export const MUTATE_START_INTERVIEW_SWR_KEY = "MUTATE_START_INTERVIEW_SWR"

/** What the startInterview write answers. */
export type StartInterviewResult = StartInterviewMutation["startInterview"]

/** The extra argument SWR hands the fetcher. */
interface StartInterviewExtra {
    readonly arg: StartInterviewInput
}

/** Sends the startInterview write; a refusal rejects with the stable code of the door. */
export const useMutateStartInterviewSwr = (): SWRMutationResponse<
    StartInterviewResult,
    unknown,
    string,
    StartInterviewInput
> =>
    useSWRMutation<StartInterviewResult, unknown, string, StartInterviewInput>(
        MUTATE_START_INTERVIEW_SWR_KEY,
        async (_key: string, { arg }: StartInterviewExtra) => {
            const { data } = await failing(() => mutateStartInterview({ request: arg }))
            if (data === undefined) throw new Error("startInterview answered no data")
            return data.startInterview
        },
    )
