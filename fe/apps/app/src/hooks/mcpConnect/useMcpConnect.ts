"use client"

import { useEffect, useState } from "react"
import {
    useMutateCreateMcpTokenSwr,
    useMutateRevokeMcpTokenSwr,
    useQueryMcpTokensSwr,
    type CreatedMcpToken,
    type McpConnection,
} from "@/hooks/swr"
import { ApiFailure } from "@/modules/failure"

/** Why a token step did not go through, as the screen words it; each comes from a stable error code, never a status. */
export type McpConnectIssue = "none" | "limit" | "name" | "other"

/** The stable mcp codes a token step answers, by the issue each one is. */
const ISSUE_OF_CODE: Readonly<Record<string, McpConnectIssue>> = {
    MCP_TOKEN_LIMIT: "limit",
    MCP_TOKEN_NAME_INVALID: "name",
}

const issueOf = (error: unknown): McpConnectIssue =>
    error instanceof ApiFailure && error.code !== undefined ? (ISSUE_OF_CODE[error.code] ?? "other") : "other"

/** What the connect screen holds and does. */
export type McpConnect = {
    /** The endpoint and the tokens, once read. */
    readonly connection: McpConnection | undefined
    readonly connectionError: unknown
    readonly isConnectionLoading: boolean
    readonly retry: () => void
    /** The endpoint as the learner pastes it: an absolute address, built on the page origin while the server knows none. */
    readonly endpoint: string
    readonly name: string
    readonly setName: (value: string) => void
    readonly create: () => void
    readonly isCreating: boolean
    /** The token just created, with its secret, until the learner leaves or creates another. */
    readonly created: CreatedMcpToken | undefined
    readonly dismissCreated: () => void
    readonly revoke: (id: string) => void
    readonly revokingId: string | undefined
    readonly issue: McpConnectIssue
}

/** The endpoint address, the learner access tokens, create and revoke, for the signed-in learner. */
export const useMcpConnect = (isSignedIn: boolean): McpConnect => {
    const [name, setName] = useState("")
    const [issue, setIssue] = useState<McpConnectIssue>("none")
    const [created, setCreated] = useState<CreatedMcpToken | undefined>(undefined)
    const [revokingId, setRevokingId] = useState<string | undefined>(undefined)
    const [origin, setOrigin] = useState("")
    const connection = useQueryMcpTokensSwr(isSignedIn)
    const creator = useMutateCreateMcpTokenSwr()
    const revoker = useMutateRevokeMcpTokenSwr()
    useEffect(() => setOrigin(window.location.origin), [])
    const declared = connection.data?.mcpConnectInfo.endpoint ?? "/mcp"
    const create = (): void => {
        setIssue("none")
        creator
            .trigger(name)
            .then((token) => {
                setCreated(token)
                setName("")
                return connection.mutate()
            })
            .catch((error: unknown) => setIssue(issueOf(error)))
    }
    const revoke = (id: string): void => {
        setRevokingId(id)
        revoker
            .trigger(id)
            .then(() => connection.mutate())
            .catch((error: unknown) => setIssue(issueOf(error)))
            .finally(() => setRevokingId(undefined))
    }
    return {
        connection: connection.data,
        connectionError: connection.error,
        isConnectionLoading: connection.isLoading,
        retry: () => void connection.mutate(),
        endpoint: declared.startsWith("/") ? `${origin}${declared}` : declared,
        name,
        setName: (value) => {
            setName(value)
            setIssue("none")
        },
        create,
        isCreating: creator.isMutating,
        created,
        dismissCreated: () => setCreated(undefined),
        revoke,
        revokingId,
        issue,
    }
}
