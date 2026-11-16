import { QueryHandler } from "@nestjs/cqrs"
import { McpTutorService, type McpConnectInfo } from "@modules/domain/mcp"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetMcpConnectInfoQuery } from "./get-mcp-connect-info.query"

@QueryHandler(GetMcpConnectInfoQuery)
/** Reads the endpoint address and the token limit. One mcp-tutor call. */
export class GetMcpConnectInfoHandler extends ICQRSHandler<GetMcpConnectInfoQuery, McpConnectInfo> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly tutor: McpTutorService,
    ) {
        super(logger)
    }

    protected override process(): Promise<McpConnectInfo> {
        return Promise.resolve(this.tutor.connectInfo())
    }
}
