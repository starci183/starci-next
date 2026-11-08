import { CommandHandler } from "@nestjs/cqrs"
import { RelayDeviceService, type DeviceToken } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { TakeRelayTokenCommand } from "./take-relay-token.command"

@CommandHandler(TakeRelayTokenCommand)
/** Exchanges the CLI device code for its device token once the learner confirmed. One relay-service call. */
export class TakeRelayTokenHandler extends ICQRSHandler<TakeRelayTokenCommand, DeviceToken> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly devices: RelayDeviceService,
    ) {
        super(logger)
    }

    protected override process(command: TakeRelayTokenCommand): Promise<DeviceToken> {
        return this.devices.token(command.params.request.deviceCode)
    }
}
