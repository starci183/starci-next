import { Args, Mutation, Query, Resolver } from "@nestjs/graphql"
import type { CommandBus, QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus, InjectQueryBus } from "@modules/platform/cqrs"
import { CreateMcpTokenCommand } from "../../application/create-mcp-token.command"
import { GetMcpConnectInfoQuery } from "../../application/get-mcp-connect-info.query"
import { ListMcpTokensQuery } from "../../application/list-mcp-tokens.query"
import { RevokeMcpTokenCommand } from "../../application/revoke-mcp-token.command"
import { CreateMcpTokenInput, RevokeMcpTokenInput } from "./dto/mcp-token.input"
import { McpConnectInfoType, McpTokenIssuedType, McpTokenType } from "./dto/mcp-token.type"
import {
    toCreateMcpTokenParams,
    toGetMcpConnectInfoParams,
    toListMcpTokensParams,
    toMcpConnectInfoType,
    toMcpTokenIssuedType,
    toMcpTokenType,
    toRevokeMcpTokenParams,
} from "./mcp-token.mapper"

@Resolver()
/** The GraphQL doors of the AI connection of a learner: where the endpoint is, and the access tokens the learner owns. */
export class McpTokenResolver {
    constructor(
        @InjectCommandBus() private readonly commandBus: CommandBus,
        @InjectQueryBus() private readonly queryBus: QueryBus,
    ) {}

    /** The endpoint address and the token limit the connect page shows. */
    @Query(() => McpConnectInfoType, { name: "mcpConnectInfo" })
    async mcpConnectInfo(@CurrentPrincipal() identity: IdentityPrincipal): Promise<McpConnectInfoType> {
        return toMcpConnectInfoType(
            await this.queryBus.execute(new GetMcpConnectInfoQuery(toGetMcpConnectInfoParams(identity))),
        )
    }

    /** The working access tokens of the caller, newest first; never a secret. */
    @Query(() => [McpTokenType], { name: "mcpTokens" })
    async mcpTokens(@CurrentPrincipal() identity: IdentityPrincipal): Promise<Array<McpTokenType>> {
        const tokens = await this.queryBus.execute(new ListMcpTokensQuery(toListMcpTokensParams(identity)))
        return tokens.map((token) => toMcpTokenType(token))
    }

    /** Creates a token for the caller; the secret comes back in this answer only. */
    @Mutation(() => McpTokenIssuedType, { name: "createMcpToken" })
    async createMcpToken(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: CreateMcpTokenInput,
    ): Promise<McpTokenIssuedType> {
        return toMcpTokenIssuedType(
            await this.commandBus.execute(new CreateMcpTokenCommand(toCreateMcpTokenParams(identity, input))),
        )
    }

    /** Revokes one token of the caller at once. */
    @Mutation(() => String, { name: "revokeMcpToken" })
    revokeMcpToken(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: RevokeMcpTokenInput,
    ): Promise<string> {
        return this.commandBus.execute(new RevokeMcpTokenCommand(toRevokeMcpTokenParams(identity, input)))
    }
}
