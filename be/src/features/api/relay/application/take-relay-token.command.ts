import { Command } from "@nestjs/cqrs"
import type { DeviceToken } from "@modules/domain/relay"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { TakeRelayTokenRequest } from "./take-relay-token.contracts"

/** Exchanges the CLI device code for its device token once the learner confirmed. */
export class TakeRelayTokenCommand extends Command<DeviceToken> {
    constructor(readonly params: PublicExecuteParams<TakeRelayTokenRequest>) {
        super()
    }
}
