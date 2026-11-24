"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type IssueRelayPairCodeMutation } from "@/modules/api"
import { mutateIssueRelayPairCode } from "@/modules/api/graphql/mutations/mutation-issue-relay-pair-code"

/** Cache identity of the issue-relay-pair-code write. */
export const MUTATE_ISSUE_RELAY_PAIR_CODE_SWR_KEY = "MUTATE_ISSUE_RELAY_PAIR_CODE_SWR"

/** The one-use pairing code and when it stops working (ISO 8601). */
export type IssuedRelayPairCode = IssueRelayPairCodeMutation["issueRelayPairCode"]

/** Issues the code the learner types after `starci-relay pair`; each call makes a new code. */
export const useMutateIssueRelayPairCodeSwr = (): SWRMutationResponse<IssuedRelayPairCode, unknown, string> =>
    useSWRMutation<IssuedRelayPairCode, unknown, string>(MUTATE_ISSUE_RELAY_PAIR_CODE_SWR_KEY, async () => {
        const { data } = await failing(() => mutateIssueRelayPairCode())
        if (data === undefined) throw new Error("issueRelayPairCode answered no data")
        return data.issueRelayPairCode
    })
