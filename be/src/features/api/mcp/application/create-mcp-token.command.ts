import { Command } from "@nestjs/cqrs"
import type { McpTokenIssued } from "@modules/domain/mcp"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { CreateMcpTokenRequest } from "./create-mcp-token.contracts"

/** Creates an access token for the signed-in learner; the secret is in the answer only. */
export class CreateMcpTokenCommand extends Command<McpTokenIssued> {
    constructor(readonly params: ExecuteParams<CreateMcpTokenRequest>) {
        super()
    }
}
