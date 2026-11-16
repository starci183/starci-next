import { CommandHandler } from "@nestjs/cqrs"
import { McpTokenService, type McpTokenIssued } from "@modules/domain/mcp"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { CreateMcpTokenCommand } from "./create-mcp-token.command"

@CommandHandler(CreateMcpTokenCommand)
/** Creates an access token for the signed-in learner within the limit. One mcp-token-service call. */
export class CreateMcpTokenHandler extends ICQRSHandler<CreateMcpTokenCommand, McpTokenIssued> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly tokens: McpTokenService,
    ) {
        super(logger)
    }

    protected override process(command: CreateMcpTokenCommand): Promise<McpTokenIssued> {
        return this.tokens.issue(command.params.principal.id, command.params.request.name)
    }
}
