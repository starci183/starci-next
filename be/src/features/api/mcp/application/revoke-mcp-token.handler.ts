import { CommandHandler } from "@nestjs/cqrs"
import { McpTokenService } from "@modules/domain/mcp"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { RevokeMcpTokenCommand } from "./revoke-mcp-token.command"

@CommandHandler(RevokeMcpTokenCommand)
/** Revokes one of the signed-in learner access tokens. One mcp-token-service call. */
export class RevokeMcpTokenHandler extends ICQRSHandler<RevokeMcpTokenCommand, string> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly tokens: McpTokenService,
    ) {
        super(logger)
    }

    protected override process(command: RevokeMcpTokenCommand): Promise<string> {
        return this.tokens.revoke(command.params.principal.id, command.params.request.tokenId)
    }
}
