import { Args, Mutation, Query, Resolver } from "@nestjs/graphql"
import { CurrentPrincipal, toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { McpTokenService, McpTutorService } from "@modules/domain/mcp"
import { CreateMcpTokenInput, RevokeMcpTokenInput } from "./dto/mcp-token.input"
import { McpConnectInfoType, McpTokenIssuedType, McpTokenType } from "./dto/mcp-token.type"

@Resolver()
/** The GraphQL doors of the AI connection of a learner: where the endpoint is, and the access tokens the learner owns. */
export class McpTokenResolver {
    constructor(
        private readonly tokens: McpTokenService,
        private readonly tutor: McpTutorService,
    ) {}

    /** The endpoint address and the token limit the connect page shows. */
    @Query(() => McpConnectInfoType, { name: "mcpConnectInfo" })
    mcpConnectInfo(): McpConnectInfoType {
        return this.tutor.connectInfo()
    }

    /** The working access tokens of the caller, newest first; never a secret. */
    @Query(() => [McpTokenType], { name: "mcpTokens" })
    async mcpTokens(@CurrentPrincipal() identity: IdentityPrincipal): Promise<Array<McpTokenType>> {
        return [...(await this.tokens.list(toPrincipal(identity).id))]
    }

    /** Creates a token for the caller; the secret comes back in this answer only. */
    @Mutation(() => McpTokenIssuedType, { name: "createMcpToken" })
    createMcpToken(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: CreateMcpTokenInput,
    ): Promise<McpTokenIssuedType> {
        return this.tokens.issue(toPrincipal(identity).id, input.name)
    }

    /** Revokes one token of the caller at once. */
    @Mutation(() => String, { name: "revokeMcpToken" })
    revokeMcpToken(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: RevokeMcpTokenInput,
    ): Promise<string> {
        return this.tokens.revoke(toPrincipal(identity).id, input.id)
    }
}
