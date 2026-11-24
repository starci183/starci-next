import { Command } from "@nestjs/cqrs"
import type { RelayDeviceKeyRegistered } from "./course-lab.contracts"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { RegisterRelayDeviceKeyRequest } from "./course-lab.contracts"

/** Registers the Ed25519 public key of the calling device. */
export class RegisterRelayDeviceKeyCommand extends Command<RelayDeviceKeyRegistered> {
    constructor(readonly params: PublicExecuteParams<RegisterRelayDeviceKeyRequest>) {
        super()
    }
}
