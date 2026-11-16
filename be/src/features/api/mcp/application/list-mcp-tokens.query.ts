import { Query } from "@nestjs/cqrs"
import type { McpTokenView } from "@modules/domain/mcp"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ListMcpTokensRequest } from "./list-mcp-tokens.contracts"

/** Lists the signed-in learner working access tokens. */
export class ListMcpTokensQuery extends Query<ReadonlyArray<McpTokenView>> {
    constructor(readonly params: ExecuteParams<ListMcpTokensRequest>) {
        super()
    }
}
