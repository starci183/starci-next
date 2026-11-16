import { Query } from "@nestjs/cqrs"
import type { McpConnectInfo } from "@modules/domain/mcp"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetMcpConnectInfoRequest } from "./get-mcp-connect-info.contracts"

/** Reads where the MCP endpoint is and how many tokens a learner may hold. */
export class GetMcpConnectInfoQuery extends Query<McpConnectInfo> {
    constructor(readonly params: ExecuteParams<GetMcpConnectInfoRequest>) {
        super()
    }
}
