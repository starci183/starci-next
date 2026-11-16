import { Command } from "@nestjs/cqrs"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RevokeMcpTokenRequest } from "./revoke-mcp-token.contracts"

/** Revokes one of the signed-in learner access tokens. */
export class RevokeMcpTokenCommand extends Command<string> {
    constructor(readonly params: ExecuteParams<RevokeMcpTokenRequest>) {
        super()
    }
}
