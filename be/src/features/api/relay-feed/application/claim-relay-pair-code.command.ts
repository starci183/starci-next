import { Command } from "@nestjs/cqrs"
import type { DeviceToken } from "@modules/domain/relay"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { ClaimRelayPairCodeRequest } from "./course-lab.contracts"

/** Exchanges a six-digit pairing code for a new device and its token. */
export class ClaimRelayPairCodeCommand extends Command<DeviceToken> {
    constructor(readonly params: PublicExecuteParams<ClaimRelayPairCodeRequest>) {
        super()
    }
}
