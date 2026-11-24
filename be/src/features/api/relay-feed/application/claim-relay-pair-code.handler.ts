import { CommandHandler } from "@nestjs/cqrs"
import { RelayDeviceService, type DeviceToken } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ClaimRelayPairCodeCommand } from "./claim-relay-pair-code.command"

@CommandHandler(ClaimRelayPairCodeCommand)
/** Exchanges a six-digit pairing code for a new device token, once. One relay-service call. */
export class ClaimRelayPairCodeHandler extends ICQRSHandler<ClaimRelayPairCodeCommand, DeviceToken> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly devices: RelayDeviceService,
    ) {
        super(logger)
    }

    protected override process(command: ClaimRelayPairCodeCommand): Promise<DeviceToken> {
        const { code, deviceName, platform } = command.params.request
        return this.devices.claimPairCode(code, deviceName, platform)
    }
}
