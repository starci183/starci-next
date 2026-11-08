import { CommandHandler } from "@nestjs/cqrs"
import { RelayFeedService, type UploadReceipt } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { UploadRelayEventCommand } from "./upload-relay-event.command"

@CommandHandler(UploadRelayEventCommand)
/** Stores one upload of the device through one relay-feed call; a resend of the same client event id stores nothing. */
export class UploadRelayEventHandler extends ICQRSHandler<UploadRelayEventCommand, UploadReceipt> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly feed: RelayFeedService,
    ) {
        super(logger)
    }

    protected override process(command: UploadRelayEventCommand): Promise<UploadReceipt> {
        return this.feed.upload(command.params.request.device, command.params.request.upload)
    }
}
