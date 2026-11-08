import { CommandHandler } from "@nestjs/cqrs"
import { RelayDeviceService, type RelayDevice } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ConfirmRelayDeviceCommand } from "./confirm-relay-device.command"

@CommandHandler(ConfirmRelayDeviceCommand)
/** Confirms a pending pairing for the signed-in learner within the plan's device limit. One relay-service call. */
export class ConfirmRelayDeviceHandler extends ICQRSHandler<ConfirmRelayDeviceCommand, RelayDevice> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly devices: RelayDeviceService,
    ) {
        super(logger)
    }

    protected override process(command: ConfirmRelayDeviceCommand): Promise<RelayDevice> {
        return this.devices.confirm(command.params.principal.id, command.params.request.userCode)
    }
}
