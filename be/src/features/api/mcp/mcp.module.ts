import { Module } from "@nestjs/common"
import { CreateMcpTokenHandler } from "./application/create-mcp-token.handler"
import { GetMcpConnectInfoHandler } from "./application/get-mcp-connect-info.handler"
import { ListMcpTokensHandler } from "./application/list-mcp-tokens.handler"
import { RevokeMcpTokenHandler } from "./application/revoke-mcp-token.handler"
import { ConfigurableModuleClass } from "./mcp.module-definition"

@Module({
    providers: [CreateMcpTokenHandler, GetMcpConnectInfoHandler, ListMcpTokensHandler, RevokeMcpTokenHandler],
})
/** Application handlers of the mcp feature: the endpoint info and the learner access tokens. */
export class McpApiModule extends ConfigurableModuleClass {}
