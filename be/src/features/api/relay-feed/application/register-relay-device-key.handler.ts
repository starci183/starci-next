import { CommandHandler } from "@nestjs/cqrs"
import { RelayDeviceService } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import type { RelayDeviceKeyRegistered } from "./course-lab.contracts"
import { RegisterRelayDeviceKeyCommand } from "./register-relay-device-key.command"

@CommandHandler(RegisterRelayDeviceKeyCommand)
/** Registers the Ed25519 public key the calling device signs grading results with, once. One relay-service call. */
export class RegisterRelayDeviceKeyHandler extends ICQRSHandler<
    RegisterRelayDeviceKeyCommand,
    RelayDeviceKeyRegistered
> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly devices: RelayDeviceService,
    ) {
        super(logger)
    }

    protected override async process(command: RegisterRelayDeviceKeyCommand): Promise<RelayDeviceKeyRegistered> {
        await this.devices.registerKey(command.params.request.device.deviceId, command.params.request.publicKey)
        return { registered: true }
    }
}
