"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing } from "@/modules/api"
import { mutateRevokeMcpToken } from "@/modules/api/graphql/mutations/mutation-revoke-mcp-token"

/** Cache identity of the revoke write. */
export const MUTATE_REVOKE_MCP_TOKEN_SWR_KEY = "MUTATE_REVOKE_MCP_TOKEN_SWR"

/** The extra argument SWR hands the mutation fetcher: the token id. */
interface RevokeMcpTokenExtra {
    readonly arg: string
}

/** Revokes one token on demand; the trigger answers the revoked id and rejects with the typed failure (MCP_TOKEN_NOT_FOUND). */
export const useMutateRevokeMcpTokenSwr = (): SWRMutationResponse<string, unknown, string, string> =>
    useSWRMutation<string, unknown, string, string>(
        MUTATE_REVOKE_MCP_TOKEN_SWR_KEY,
        async (_key: string, { arg }: RevokeMcpTokenExtra) => {
            const { data } = await failing(() => mutateRevokeMcpToken({ id: arg }))
            if (data === undefined) throw new Error("revokeMcpToken answered no data")
            return data.revokeMcpToken
        },
    )
