import { Command } from "@nestjs/cqrs"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RevokeRelayDeviceRequest } from "./revoke-relay-device.contracts"

/** Revokes one of the signed-in learner's devices. */
export class RevokeRelayDeviceCommand extends Command<string> {
    constructor(readonly params: ExecuteParams<RevokeRelayDeviceRequest>) {
        super()
    }
}
