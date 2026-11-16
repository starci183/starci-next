"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type CreateMcpTokenMutation } from "@/modules/api"
import { mutateCreateMcpToken } from "@/modules/api/graphql/mutations/mutation-create-mcp-token"

/** Cache identity of the create write. */
export const MUTATE_CREATE_MCP_TOKEN_SWR_KEY = "MUTATE_CREATE_MCP_TOKEN_SWR"

/** The token just created, with its secret. */
export type CreatedMcpToken = CreateMcpTokenMutation["createMcpToken"]

/** The extra argument SWR hands the mutation fetcher: the name for the token. */
interface CreateMcpTokenExtra {
    readonly arg: string
}

/** Creates a token on demand; the trigger rejects with the typed failure (MCP_TOKEN_LIMIT, MCP_TOKEN_NAME_INVALID). */
export const useMutateCreateMcpTokenSwr = (): SWRMutationResponse<CreatedMcpToken, unknown, string, string> =>
    useSWRMutation<CreatedMcpToken, unknown, string, string>(
        MUTATE_CREATE_MCP_TOKEN_SWR_KEY,
        async (_key: string, { arg }: CreateMcpTokenExtra) => {
            const { data } = await failing(() => mutateCreateMcpToken({ name: arg }))
            if (data === undefined) throw new Error("createMcpToken answered no data")
            return data.createMcpToken
        },
    )
