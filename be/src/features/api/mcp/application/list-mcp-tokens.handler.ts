import { QueryHandler } from "@nestjs/cqrs"
import { McpTokenService, type McpTokenView } from "@modules/domain/mcp"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ListMcpTokensQuery } from "./list-mcp-tokens.query"

@QueryHandler(ListMcpTokensQuery)
/** Lists the signed-in learner working access tokens. One mcp-token-service call. */
export class ListMcpTokensHandler extends ICQRSHandler<ListMcpTokensQuery, ReadonlyArray<McpTokenView>> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly tokens: McpTokenService,
    ) {
        super(logger)
    }

    protected override process(query: ListMcpTokensQuery): Promise<ReadonlyArray<McpTokenView>> {
        return this.tokens.list(query.params.principal.id)
    }
}
