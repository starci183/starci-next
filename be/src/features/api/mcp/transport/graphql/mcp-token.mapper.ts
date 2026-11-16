import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { McpConnectInfo, McpTokenIssued, McpTokenView } from "@modules/domain/mcp"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { CreateMcpTokenRequest } from "../../application/create-mcp-token.contracts"
import type { GetMcpConnectInfoRequest } from "../../application/get-mcp-connect-info.contracts"
import type { ListMcpTokensRequest } from "../../application/list-mcp-tokens.contracts"
import type { RevokeMcpTokenRequest } from "../../application/revoke-mcp-token.contracts"
import type { CreateMcpTokenInput, RevokeMcpTokenInput } from "./dto/mcp-token.input"
import type { McpConnectInfoType, McpTokenIssuedType, McpTokenType } from "./dto/mcp-token.type"

/** Maps the session to the connect info query params. */
export const toGetMcpConnectInfoParams = (identity: IdentityPrincipal): ExecuteParams<GetMcpConnectInfoRequest> => ({
    request: {},
    principal: toPrincipal(identity),
})

/** Maps the session to the token list query params. */
export const toListMcpTokensParams = (identity: IdentityPrincipal): ExecuteParams<ListMcpTokensRequest> => ({
    request: {},
    principal: toPrincipal(identity),
})

/** Maps a token name and the session to the create command params. */
export const toCreateMcpTokenParams = (
    identity: IdentityPrincipal,
    input: CreateMcpTokenInput,
): ExecuteParams<CreateMcpTokenRequest> => ({ request: { name: input.name }, principal: toPrincipal(identity) })

/** Maps a token id and the session to the revoke command params. */
export const toRevokeMcpTokenParams = (
    identity: IdentityPrincipal,
    input: RevokeMcpTokenInput,
): ExecuteParams<RevokeMcpTokenRequest> => ({ request: { tokenId: input.id }, principal: toPrincipal(identity) })

/** Maps the connect info to its GraphQL type. */
export const toMcpConnectInfoType = (info: McpConnectInfo): McpConnectInfoType => ({
    endpoint: info.endpoint,
    tokenLimit: info.tokenLimit,
})

/** Maps a token to its GraphQL type. */
export const toMcpTokenType = (token: McpTokenView): McpTokenType => ({
    id: token.id,
    name: token.name,
    hint: token.hint,
    createdAt: token.createdAt,
    lastUsedAt: token.lastUsedAt,
})

/** Maps a token just created, with its secret, to its GraphQL type. */
export const toMcpTokenIssuedType = (token: McpTokenIssued): McpTokenIssuedType => ({
    ...toMcpTokenType(token),
    secret: token.secret,
})
