import { CommandHandler } from "@nestjs/cqrs"
import { RelayDeviceService, type DevicePairing } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { StartRelayPairingCommand } from "./start-relay-pairing.command"

@CommandHandler(StartRelayPairingCommand)
/** Opens a device pairing for the learner CLI, the start of the gh-auth-login style flow. One relay-service call. */
export class StartRelayPairingHandler extends ICQRSHandler<StartRelayPairingCommand, DevicePairing> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly devices: RelayDeviceService,
    ) {
        super(logger)
    }

    protected override process(command: StartRelayPairingCommand): Promise<DevicePairing> {
        return this.devices.start(command.params.request)
    }
}
