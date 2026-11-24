import { CommandHandler } from "@nestjs/cqrs"
import { RelayFeedService, RelayLabService, isLabUploadKind, type UploadReceipt } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { UploadRelayEventCommand } from "./upload-relay-event.command"

@CommandHandler(UploadRelayEventCommand)
/**
 * Stores one upload of the device through one relay call: the four lab kinds change the lab state through the lab service, every other
 * kind is stored by the feed. A resend of the same client event id stores nothing.
 */
export class UploadRelayEventHandler extends ICQRSHandler<UploadRelayEventCommand, UploadReceipt> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly feed: RelayFeedService,
        private readonly lab: RelayLabService,
    ) {
        super(logger)
    }

    protected override process(command: UploadRelayEventCommand): Promise<UploadReceipt> {
        const { device, upload } = command.params.request
        return isLabUploadKind(upload.kind) ? this.lab.upload(device, upload) : this.feed.upload(device, upload)
    }
}
