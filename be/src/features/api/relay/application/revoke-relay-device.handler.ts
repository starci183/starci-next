import { CommandHandler } from "@nestjs/cqrs"
import { RelayDeviceService } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { RevokeRelayDeviceCommand } from "./revoke-relay-device.command"

@CommandHandler(RevokeRelayDeviceCommand)
/** Revokes one of the signed-in learner's devices. One relay-service call. */
export class RevokeRelayDeviceHandler extends ICQRSHandler<RevokeRelayDeviceCommand, string> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly devices: RelayDeviceService,
    ) {
        super(logger)
    }

    protected override process(command: RevokeRelayDeviceCommand): Promise<string> {
        return this.devices.revoke(command.params.principal.id, command.params.request.deviceId)
    }
}
