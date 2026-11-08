import { Command } from "@nestjs/cqrs"
import type { RelayDevice } from "@modules/domain/relay"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ConfirmRelayDeviceRequest } from "./confirm-relay-device.contracts"

/** Confirms a pending pairing for the signed-in learner within the plan's device limit. */
export class ConfirmRelayDeviceCommand extends Command<RelayDevice> {
    constructor(readonly params: ExecuteParams<ConfirmRelayDeviceRequest>) {
        super()
    }
}
