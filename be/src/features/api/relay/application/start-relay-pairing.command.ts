import { Command } from "@nestjs/cqrs"
import type { DevicePairing } from "@modules/domain/relay"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { StartRelayPairingRequest } from "./start-relay-pairing.contracts"

/** Opens a device pairing for the learner CLI, the start of the gh-auth-login style flow. */
export class StartRelayPairingCommand extends Command<DevicePairing> {
    constructor(readonly params: PublicExecuteParams<StartRelayPairingRequest>) {
        super()
    }
}
