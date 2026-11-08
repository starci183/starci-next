import { Command } from "@nestjs/cqrs"
import type { UploadReceipt } from "@modules/domain/relay"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { UploadRelayEventRequest } from "./upload-relay-event.contracts"

/** Stores one upload of the device once per client event id. */
export class UploadRelayEventCommand extends Command<UploadReceipt> {
    constructor(readonly params: PublicExecuteParams<UploadRelayEventRequest>) {
        super()
    }
}
